import React, { useState, useEffect } from 'react';
import { Plus, Users, IndianRupee, FileText, Download, Wallet, Trash2, Edit2, X, Briefcase } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const paymentModes = ['Cash', 'Bank Transfer', 'UPI', 'Cheque'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empForm, setEmpForm] = useState(getInitialEmpForm());
  const [payForm, setPayForm] = useState(getInitialPayForm());

  function getInitialEmpForm() {
    return { id: null, name: '', mobile: '', post: '', joinDate: new Date().toISOString().split('T')[0], salary: '' };
  }

  function getInitialPayForm() {
    return { employeeId: '', date: new Date().toISOString().split('T')[0], amount: '', paymentMode: 'Cash', month: months[new Date().getMonth()], notes: '' };
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
    if(window.confirm('Delete this employee and all their payments?')) {
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
        fetchEmployees();
        setIsPayModalOpen(false);
        setPayForm(getInitialPayForm());
      }
    } catch (error) {
      console.error('Error saving payment:', error);
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
  const totalPaid = employees.reduce((sum, e) => sum + (e.totalPaid || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Employee Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage staff, offer letters, and salary payments.</p>
        </div>
        <button 
          onClick={() => { setEmpForm(getInitialEmpForm()); setIsEmpModalOpen(true); }}
          className="px-4 py-2 bg-gradient-to-r from-aquro-600 to-aquro-500 text-white rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <p className="text-sm font-medium text-slate-500">Total Salary Paid</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">₹{totalPaid.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><IndianRupee className="w-6 h-6" /></div>
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
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Paid</th>
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
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
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
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-emerald-600">
                      ₹{(emp.totalPaid || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => downloadPolicyPDF(emp)} className="text-aquro-600 hover:text-aquro-800 mr-3" title="Download Offer Letter">
                        <Download className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setSelectedEmp(emp); setPayForm(getInitialPayForm()); setIsPayModalOpen(true); }} className="text-emerald-600 hover:text-emerald-800 mr-3" title="Make Payment">
                        <Wallet className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setEmpForm(emp); setIsEmpModalOpen(true); }} className="text-slate-600 hover:text-slate-800 mr-3">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteEmployee(emp.id)} className="text-red-500 hover:text-red-700">
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
                <button type="submit" className="w-full py-2.5 bg-aquro-600 text-white rounded-lg hover:bg-aquro-700 font-medium">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPayModalOpen && selectedEmp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden relative">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Pay Salary: {selectedEmp.name}</h3>
              <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePayment} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹) *</label>
                  <input required type="number" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-bold text-emerald-600" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date *</label>
                  <input required type="date" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={payForm.date} onChange={e => setPayForm({...payForm, date: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Salary Month *</label>
                  <select className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={payForm.month} onChange={e => setPayForm({...payForm, month: e.target.value})}>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode *</label>
                  <select className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={payForm.paymentMode} onChange={e => setPayForm({...payForm, paymentMode: e.target.value})}>
                    {paymentModes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                <input type="text" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" value={payForm.notes} onChange={e => setPayForm({...payForm, notes: e.target.value})} placeholder="e.g. Advance, Overtime bonus..." />
              </div>
              <div className="mt-6 flex gap-3">
                <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
