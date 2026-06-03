from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from models import db, Criminal, CrimeRelationship, NetworkEntity

try:
    import networkx as nx
    NETWORKX_AVAILABLE = True
except ImportError:
    NETWORKX_AVAILABLE = False

network_bp = Blueprint('network', __name__)

@network_bp.route('/criminals', methods=['GET'])
@jwt_required()
def get_criminal_network():
    """Compiles repeat offender profiles and accomplice links into a force-directed layout format."""
    gang_filter = request.args.get('gang')
    min_risk = request.args.get('min_risk', 0, type=float)
    
    # 1. Fetch Criminal Nodes
    node_query = Criminal.query
    if gang_filter and gang_filter != 'All':
        node_query = node_query.filter(Criminal.gang_affiliation == gang_filter)
    if min_risk > 0:
        node_query = node_query.filter(Criminal.risk_score >= min_risk)
        
    criminals = node_query.all()
    criminal_ids = {c.criminal_id for c in criminals}
    
    # 2. Fetch Accomplice Links
    relationship_query = CrimeRelationship.query
    relationships = relationship_query.all()
    
    # Only include relationships where both criminals exist in our node list
    valid_links = []
    for r in relationships:
        if r.criminal_a in criminal_ids and r.criminal_b in criminal_ids:
            valid_links.append({
                'source': r.criminal_a,
                'target': r.criminal_b,
                'type': r.relation_type
            })
            
    # 3. Calculate Network Centrality Metrics using NetworkX
    centrality_map = {}
    if NETWORKX_AVAILABLE and len(criminals) > 1:
        try:
            G = nx.Graph()
            # Add nodes
            for c in criminals:
                G.add_node(c.criminal_id)
            # Add edges
            for link in valid_links:
                G.add_edge(link['source'], link['target'])
                
            # Compute degree centrality
            centrality = nx.degree_centrality(G)
            for cid, score in centrality.items():
                centrality_map[cid] = round(score * 100, 1)
        except Exception as e:
            print(f"[NetworkX Centrality] Calculation error: {e}")
            
    # Compile nodes response
    nodes = []
    for c in criminals:
        nodes.append({
            'id': c.criminal_id,
            'name': c.name,
            'age': c.age,
            'gang': c.gang_affiliation,
            'crimes_committed': c.crime_history_count,
            'risk_score': c.risk_score,
            'centrality_index': centrality_map.get(c.criminal_id, 0.0),
            'type': 'Criminal'
        })
        
    # Fetch connected network entities (Priority 6)
    entities = NetworkEntity.query.filter(NetworkEntity.criminal_owner_id.in_(list(criminal_ids))).all()
    entity_nodes = []
    entity_links = []
    for e in entities:
        entity_node_id = f"entity_{e.entity_id}"
        entity_nodes.append({
            'id': entity_node_id,
            'name': e.value,
            'type': e.entity_type,
            'gang': 'None',
            'crimes_committed': 0,
            'risk_score': 15.0,
            'centrality_index': 0.0
        })
        entity_links.append({
            'source': e.criminal_owner_id,
            'target': entity_node_id,
            'type': f"Owns {e.entity_type}"
        })
        
    # Expose gangs lists for filter toggles
    gangs = db.session.query(Criminal.gang_affiliation).distinct().all()
    gang_list = [g[0] for g in gangs if g[0] and g[0] != 'None']
    
    return jsonify({
        'nodes': nodes + entity_nodes,
        'links': valid_links + entity_links,
        'available_gangs': gang_list
    }), 200

@network_bp.route('/offenders', methods=['GET'])
@jwt_required()
def get_offender_list():
    """Lists offenders with filters and arrest metrics for dossier screens."""
    limit = request.args.get('limit', 50, type=int)
    risk_level = request.args.get('risk_level')
    
    query = Criminal.query
    
    if risk_level and risk_level != 'All':
        if risk_level == 'Critical':
            query = query.filter(Criminal.risk_score >= 80)
        elif risk_level == 'High':
            query = query.filter(Criminal.risk_score >= 55, Criminal.risk_score < 80)
        elif risk_level == 'Medium':
            query = query.filter(Criminal.risk_score >= 30, Criminal.risk_score < 55)
        else:
            query = query.filter(Criminal.risk_score < 30)
            
    # Order by risk score descending
    results = query.order_by(Criminal.risk_score.desc()).limit(limit).all()
    return jsonify([c.to_dict() for c in results]), 200
