import React, { useState, useEffect } from 'react';
import { Plus, Users, IndianRupee, FileText, Download, Wallet, Trash2, Edit2, X, Briefcase, TrendingUp, TrendingDown } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const paymentModes = ['Cash', 'Bank Transfer', 'UPI', 'Cheque'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empForm, setEmpForm] = useState(getInitialEmpForm());
  const [payForm, setPayForm] = useState(getInitialPayForm());

  function getInitialEmpForm() {
    return { id: null, name: '', mobile: '', post: '', joinDate: new Date().toISOString().split('T')[0], salary: '' };
  }

  function getInitialPayForm() {
    return { employeeId: '', date: new Date().toISOString().split('T')[0], amount: '', type: 'Debit', paymentMode: 'Cash', month: months[new Date().getMonth()], notes: '' };
  }

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com') + '/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.map(e => ({ ...e, id: e._id })));
        // Refresh selectedEmp if ledger is open
        if (selectedEmp) {
          const updatedEmp = data.find(e => e._id === selectedEmp.id);
          if (updatedEmp) setSelectedEmp({ ...updatedEmp, id: updatedEmp._id });
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    const payload = { ...empForm, salary: parseFloat(empForm.salary) || 0 };
    const isEdit = !!empForm.id;
    const baseUrl = import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com';
    const url = isEdit ? `${baseUrl}/api/employees/${empForm.id}` : `${baseUrl}/api/employees`;
    
    try {
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const newEmp = await response.json();
        fetchEmployees();
        setIsEmpModalOpen(false);
        if (!isEdit) {
           downloadPolicyPDF(newEmp);
        }
        setEmpForm(getInitialEmpForm());
      }
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if(window.confirm('Delete this employee and all their ledger entries?')) {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com';
      try {
        const res = await fetch(`${baseUrl}/api/employees/${id}`, { method: 'DELETE' });
        if(res.ok) fetchEmployees();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    const payload = { ...payForm, amount: parseFloat(payForm.amount) || 0, employeeId: selectedEmp.id };
    const baseUrl = import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com';
    
    try {
      const response = await fetch(`${baseUrl}/api/employees/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setPayForm(getInitialPayForm());
        fetchEmployees();
      }
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  };

  const handleDeletePayment = async (payId) => {
    if(window.confirm('Delete this ledger entry?')) {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://aquro-backend-api.onrender.com';
      try {
        const res = await fetch(`${baseUrl}/api/employees/payment/${payId}`, { method: 'DELETE' });
        if(res.ok) fetchEmployees();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const downloadPolicyPDF = (emp) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(30, 64, 175); // aquro-800
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("AQURO", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Pure Drinking Water Plant", 105, 28, { align: "center" });

    // Title
    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("EMPLOYEE OFFER & POLICY LETTER", 105, 55, { align: "center" });

    // Details
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 20, 75);
    doc.text(`Employee Name: ${emp.name}`, 20, 85);
    doc.text(`Mobile Number: ${emp.mobile}`, 20, 95);
    doc.text(`Designation (Post): ${emp.post}`, 20, 105);
    doc.text(`Date of Joining: ${new Date(emp.joinDate).toLocaleDateString('en-GB')}`, 20, 115);
    doc.text(`Agreed Salary: Rs. ${emp.salary} per month`, 20, 125);

    // Policy text
    doc.setFont("helvetica", "bold");
    doc.text("Company Policies & Rules:", 20, 145);
    
    doc.setFont("helvetica", "normal");
    const policies = [
      "1. Employee must maintain strict hygiene standards inside the plant.",
      "2. Working hours must be strictly followed as instructed by the Manager.",
      "3. Use of mobile phones is restricted during active production and dispatch hours.",
      "4. Any damage to plant property will result in strict action.",
      "5. Salary will be processed between 1st to 5th of every month.",
      "6. Safety gear provided by the company must be worn at all times.",
      "7. Unauthorized leaves without prior notice are not permitted."
    ];
    
    let y = 155;
    policies.forEach(p => {
      doc.text(p, 20, y);
      y += 8;
    });

    // Signatures
    doc.setFont("helvetica", "bold");
    doc.text("Authorized Signatory", 30, y + 40);
    doc.text("Employee Signature", 140, y + 40);
    
    // Save
    doc.save(`${emp.name}_Offer_Letter.pdf`);
  };

  const totalEmployees = employees.length;
  const totalBalanceDue = employees.reduce((sum, e) => sum + (e.balance > 0 ? e.balance : 0), 0);
  const totalAdvance = employees.reduce((sum, e) => sum + (e.balance < 0 ? Math.abs(e.balance) : 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Employee Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage staff, offer letters, and salary ledger (Credit/Debit).</p>
        </div>
        <button 
          onClick={() => { setEmpForm(getInitialEmpForm()); setIsEmpModalOpen(true); }}
          className="px-4 py-2 bg-gradient-to-r from-aquro-600 to-aquro-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-l-4 border-l-aquro-500 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Employees</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{totalEmployees}</h3>
            </div>
            <div className="p-3 bg-aquro-50 text-aquro-600 rounded-xl"><Users className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-emerald-500 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Due (To Pay)</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">₹{totalBalanceDue.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-red-500 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Advance Given</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">₹{totalAdvance.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-xl"><TrendingDown className="w-6 h-6" /></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name & Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Post & Joining</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Salary (₹)</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Ledger Balance</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">No employees added yet.</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr 
                    key={emp.id} 
                    onClick={() => { setSelectedEmp(emp); setPayForm(getInitialPayForm()); setIsLedgerModalOpen(true); }}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{emp.name}</div>
                      <div className="text-sm text-slate-500">{emp.mobile}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-700">{emp.post}</div>
                      <div className="text-xs text-slate-500">Joined: {new Date(emp.joinDate).toLocaleDateString('en-GB')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-slate-700">
                      ₹{emp.salary.toLocaleString()}/mo
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${emp.balance > 0 ? 'text-emerald-600' : emp.balance < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                      {emp.balance > 0 ? `₹${emp.balance.toLocaleString()} (Due)` : emp.balance < 0 ? `₹${Math.abs(emp.balance).toLocaleString()} (Adv)` : '₹0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={(e) => { e.stopPropagation(); downloadPolicyPDF(emp); }} className="text-aquro-600 hover:text-aquro-800 mr-3" title="Download Offer Letter">
                        <Download className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedEmp(emp); setPayForm(getInitialPayForm()); setIsLedgerModalOpen(true); }} className="text-emerald-600 hover:text-emerald-800 mr-3" title="Employee Ledger (Credit/Debit)">
                        <Wallet className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setEmpForm(emp); setIsEmpModalOpen(true); }} className="text-slate-600 hover:text-slate-800 mr-3" title="Edit Employee">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp.id); }} className="text-red-500 hover:text-red-700" title="Delete Employee">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEmpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden relative">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">{empForm.id ? 'Edit Employee' : 'Add Employee'}</h3>
              <button onClick={() => setIsEmpModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input required type="text" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number *</label>
                <input required type="text" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={empForm.mobile} onChange={e => setEmpForm({...empForm, mobile: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Designation (Post) *</label>
                  <input required type="text" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={empForm.post} onChange={e => setEmpForm({...empForm, post: e.target.value})} placeholder="e.g. Driver, Helper" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Salary (₹) *</label>
                  <input required type="number" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={empForm.salary} onChange={e => setEmpForm({...empForm, salary: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Join Date *</label>
                <input required type="date" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={empForm.joinDate} onChange={e => setEmpForm({...empForm, joinDate: e.target.value})} />
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setIsEmpModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-aquro-600 text-white rounded-lg hover:bg-aquro-700 font-medium">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLedgerModalOpen && selectedEmp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Ledger: {selectedEmp.name}</h3>
              <div className="flex items-center gap-4">
                <span className={`font-bold px-3 py-1 rounded-lg ${selectedEmp.balance > 0 ? 'bg-emerald-100 text-emerald-700' : selectedEmp.balance < 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                  Balance: {selectedEmp.balance > 0 ? `₹${selectedEmp.balance.toLocaleString()} (Due)` : selectedEmp.balance < 0 ? `₹${Math.abs(selectedEmp.balance).toLocaleString()} (Adv)` : '₹0'}
                </span>
                <button onClick={() => setIsLedgerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* Add Entry Form */}
              <div className="w-full md:w-1/3 p-4 bg-slate-50 border-r border-slate-200 overflow-y-auto">
                <h4 className="font-semibold text-slate-700 mb-4">Add Ledger Entry</h4>
                <form onSubmit={handleSavePayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Entry Type *</label>
                    <select className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-bold bg-white" value={payForm.type} onChange={e => setPayForm({...payForm, type: e.target.value})}>
                      <option value="Credit">Credit (+ Salary Due / Plant Received)</option>
                      <option value="Debit">Debit (- Advance / Salary Paid)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹) *</label>
                    <input required type="number" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-bold" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                    <input required type="date" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white" value={payForm.date} onChange={e => setPayForm({...payForm, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Salary Month (Optional)</label>
                    <select className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white" value={payForm.month} onChange={e => setPayForm({...payForm, month: e.target.value})}>
                      {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode *</label>
                    <select className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white" value={payForm.paymentMode} onChange={e => setPayForm({...payForm, paymentMode: e.target.value})}>
                      {paymentModes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Description</label>
                    <input type="text" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white" value={payForm.notes} onChange={e => setPayForm({...payForm, notes: e.target.value})} placeholder="e.g. October Salary, Cash Advance..." />
                  </div>
                  <button type="submit" className={`w-full py-2.5 text-white rounded-lg font-medium transition-colors ${payForm.type === 'Credit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                    Add {payForm.type} Entry
                  </button>
                </form>
              </div>

              {/* Transactions List */}
              <div className="w-full md:w-2/3 p-4 overflow-y-auto bg-white">
                <h4 className="font-semibold text-slate-700 mb-4">Transaction History</h4>
                {selectedEmp.payments && selectedEmp.payments.length > 0 ? (
                  <div className="space-y-3">
                    {selectedEmp.payments.map((pay) => (
                      <div key={pay._id} className={`p-4 rounded-xl border flex items-center justify-between ${pay.type === 'Credit' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${pay.type === 'Credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {pay.type === 'Credit' ? 'CREDIT (+)' : 'DEBIT (-)'}
                            </span>
                            <span className="text-sm font-medium text-slate-500">{new Date(pay.date).toLocaleDateString('en-GB')}</span>
                            {pay.month && <span className="text-xs text-slate-400">({pay.month})</span>}
                          </div>
                          <div className="text-sm text-slate-700">
                            {pay.notes || (pay.type === 'Credit' ? 'Salary Due/Credit Added' : 'Payment/Advance Given')} 
                            <span className="ml-2 text-xs text-slate-400">via {pay.paymentMode}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-lg font-bold ${pay.type === 'Credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {pay.type === 'Credit' ? '+' : '-'}₹{pay.amount.toLocaleString()}
                          </span>
                          <button onClick={() => handleDeletePayment(pay._id)} className="text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-500">
                    No ledger entries found for this employee.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
