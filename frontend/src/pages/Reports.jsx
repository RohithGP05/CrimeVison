import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

const Reports = () => {
  const { getAuthHeaders } = useAuth();
  
  // Parameter filters
  const [filterDistrict, setFilterDistrict] = useState('Bangalore Urban');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2026-05-30');
  
  const [options, setOptions] = useState({ districts: [] });
  
  // Printable summary state
  const [summaryData, setSummaryData] = useState(null);
  
  // UI states
  const [exporting, setExporting] = useState(false);
  const [fetchingSummary, setFetchingSummary] = useState(false);

  const fetchOptions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/crimes/filter-options', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setOptions(data);
      }
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  };

  const fetchSummaryReport = async () => {
    setFetchingSummary(true);
    try {
      const params = new URLSearchParams({
        district: filterDistrict,
        start_date: startDate,
        end_date: endDate
      });
      
      const response = await fetch(`http://localhost:5000/api/reports/summary-report?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSummaryData(data);
      }
    } catch (err) {
      console.error('Error fetching report summaries:', err);
    } finally {
      setFetchingSummary(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchSummaryReport();
  }, [filterDistrict, startDate, endDate]);

  // Secure JS Blob file downloader to include Auth JWT headers
  const triggerSecureDownload = async (format) => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        district: filterDistrict,
        start_date: startDate,
        end_date: endDate,
        format: format
      });
      
      const response = await fetch(`http://localhost:5000/api/reports/export?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Export service failure');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const filename = `KSP_CrimeVision_${filterDistrict}_Export.${format === 'csv' ? 'csv' : 'xls'}`.replace(/\s+/g, '_');
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export download error:', err);
      alert('Report download failed. Check server logs.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 print:p-0 print:bg-white print:text-black">
      
      {/* Title Header - Hide on print */}
      <div className="print:hidden">
        <h2 className="text-xl font-bold tracking-wide uppercase text-slate-100 flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-blue-500" />
          <span>Analytical Reports & Export</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Compile print-ready police reports and securely download CSV/Excel dataset packages.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Export Parameters Card - Hide on print */}
        <div className="glass-panel p-5 rounded-xl border border-slate-900 space-y-4 print:hidden">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 pb-2.5 border-b border-slate-800">
            <Filter className="w-4 h-4 text-blue-500" />
            <span>Scope Parameters</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex flex-col">
              <label className="text-[10px] text-slate-500 font-mono mb-1.5 uppercase">Select District Scope</label>
              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-lg text-slate-300 transition-colors"
              >
                {options.districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] text-slate-500 font-mono mb-1.5 uppercase">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-lg text-slate-300 transition-colors"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] text-slate-500 font-mono mb-1.5 uppercase">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-lg text-slate-300 transition-colors"
              />
            </div>

            <div className="space-y-2.5 pt-4">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Download analytical data</span>
              
              <button
                onClick={() => triggerSecureDownload('csv')}
                disabled={exporting}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/40 text-white font-bold transition-colors uppercase text-[10px] tracking-wider"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>Download CSV File</span>
              </button>

              <button
                onClick={() => triggerSecureDownload('excel')}
                disabled={exporting}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/40 text-white font-bold transition-colors uppercase text-[10px] tracking-wider"
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <span>Download XLS File</span>
              </button>
            </div>
          </div>
          
          <div className="p-3 mt-4 rounded bg-slate-900/20 border border-slate-900/60 flex gap-2 text-[9px] font-mono text-slate-500 leading-relaxed">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <span>Exports use asynchronous stream writers, preventing server memory locks during database downloads.</span>
          </div>
        </div>

        {/* Printable Report Layout Card */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Print trigger banner - Hide on print */}
          <div className="glass-panel p-4 rounded-xl border border-slate-900 flex justify-between items-center print:hidden">
            <span className="text-xs text-slate-400">
              Visualizing printable dossier below for: <b className="text-slate-200">{filterDistrict}</b>
            </span>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Dossier</span>
            </button>
          </div>

          {/* Dossier Printable Sheet (Styled cleanly for print layout styling) */}
          <div className="glass-panel p-8 rounded-2xl border border-slate-900 space-y-6 bg-slate-900/10 min-h-[500px] relative print:border-none print:bg-white print:text-black">
            
            {/* Top header decoration */}
            <div className="absolute top-0 inset-x-0 h-2 bg-blue-600 rounded-t-2xl print:hidden"></div>

            {/* Document Emblem Header */}
            <div className="flex justify-between items-start border-b border-slate-800 print:border-slate-300 pb-5">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black glow-blue print:bg-blue-600 print:text-white shrink-0">
                  KSP
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest print:text-black">
                    Karnataka State Police Department
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5 block print:text-slate-600">
                    CrimeVision AI Analyst Ledger
                  </span>
                </div>
              </div>
              <div className="text-right text-[10px] font-mono text-slate-500 print:text-slate-600">
                <p>STATUS: CONFIDENTIAL</p>
                <p>COMPILED: {summaryData?.generated_at}</p>
              </div>
            </div>

            {/* Scope Summary Details */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">TARGET ASSESSMENT</span>
                <h4 className="text-lg font-bold text-slate-200 uppercase print:text-black">{filterDistrict} Division</h4>
                <p className="text-[10.5px] font-mono text-slate-500 mt-0.5 print:text-slate-600">
                  Analytical history query spanning from {startDate} to {endDate}.
                </p>
              </div>

              {fetchingSummary ? (
                <div className="h-40 flex justify-center items-center">
                  <span className="w-6 h-6 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin"></span>
                </div>
              ) : summaryData ? (
                <div className="space-y-6">
                  
                  {/* Aggregated Totals grid */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-900 print:bg-slate-100 print:border-slate-200">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase print:text-slate-600">Total Crimes Logged</span>
                      <span className="text-xl font-bold font-mono text-slate-200 print:text-black">{summaryData.total_crimes}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-900 print:bg-slate-100 print:border-slate-200">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase print:text-slate-600">Active Investigations</span>
                      <span className="text-xl font-bold font-mono text-blue-400 print:text-blue-600">{summaryData.active_cases}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-900 print:bg-slate-100 print:border-slate-200">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase print:text-slate-600">Closed Dossiers</span>
                      <span className="text-xl font-bold font-mono text-emerald-500 print:text-emerald-600">
                        {summaryData.total_crimes - summaryData.active_cases}
                      </span>
                    </div>
                  </div>

                  {/* Incident Severity Breakdown Table */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Severity Density Table</span>
                    <table className="w-full text-[11px] font-mono text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 print:border-slate-300 text-slate-400 print:text-slate-600 text-[10px] uppercase">
                          <th className="py-2">Severity Level</th>
                          <th className="py-2 text-right">Logged Incident Count</th>
                          <th className="py-2 text-right">Percentage Split</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-900/60 print:border-slate-200 text-red-500 font-bold">
                          <td className="py-2">CRITICAL THREAT</td>
                          <td className="py-2 text-right font-bold">{summaryData.severities?.Critical || 0}</td>
                          <td className="py-2 text-right">
                            {Math.round((summaryData.severities?.Critical / summaryData.total_crimes) * 100 || 0)}%
                          </td>
                        </tr>
                        <tr className="border-b border-slate-900/60 print:border-slate-200 text-orange-400">
                          <td className="py-2">HIGH DENSITY</td>
                          <td className="py-2 text-right font-bold">{summaryData.severities?.High || 0}</td>
                          <td className="py-2 text-right">
                            {Math.round((summaryData.severities?.High / summaryData.total_crimes) * 100 || 0)}%
                          </td>
                        </tr>
                        <tr className="border-b border-slate-900/60 print:border-slate-200 text-yellow-500">
                          <td className="py-2">MEDIUM DENSITY</td>
                          <td className="py-2 text-right font-bold">{summaryData.severities?.Medium || 0}</td>
                          <td className="py-2 text-right">
                            {Math.round((summaryData.severities?.Medium / summaryData.total_crimes) * 100 || 0)}%
                          </td>
                        </tr>
                        <tr className="border-b border-slate-900/60 print:border-slate-200 text-green-500">
                          <td className="py-2">LOW SEVERITY</td>
                          <td className="py-2 text-right font-bold">{summaryData.severities?.Low || 0}</td>
                          <td className="py-2 text-right">
                            {Math.round((summaryData.severities?.Low / summaryData.total_crimes) * 100 || 0)}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Signatures / Endorsements footer */}
                  <div className="pt-8 border-t border-slate-800 print:border-slate-300 grid grid-cols-2 gap-10 mt-12 text-[10px] font-mono text-slate-500 print:text-slate-600">
                    <div>
                      <p className="uppercase">COMPILED BY SYSTEM AUTHORIZATION:</p>
                      <p className="font-bold text-slate-350 print:text-black mt-1">CrimeVision AI Engine V1.4</p>
                      <div className="h-0.5 bg-slate-800 print:bg-slate-300 w-32 mt-3"></div>
                      <span className="text-[8px] text-slate-600 block mt-1">SECURE LOG DECRYPTED</span>
                    </div>

                    <div className="text-right">
                      <p className="uppercase">DEPARTMENT OFFICER SIGN-OFF:</p>
                      <p className="font-bold text-slate-350 print:text-black mt-1">Authorized Analyst Signature</p>
                      <div className="h-0.5 bg-slate-800 print:bg-slate-300 w-32 ml-auto mt-3"></div>
                      <span className="text-[8px] text-slate-600 block mt-1">ENDORSEMENT REQUIRED</span>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center text-slate-500 text-xs py-10 font-mono">
                  Loading dossier metrics summary...
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Embedded CSS overrides for standard print-media styling */}
      <style>{`
        @media print {
          aside, header, button, .print\\:hidden {
            display: none !important;
          }
          body {
            background-color: white !important;
            color: black !important;
          }
          .print\\:border-none {
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

    </div>
  );
};

export default Reports;
