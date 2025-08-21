import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Camera, Edit, Save, X, Trash2, ZoomIn } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { AttendanceRecord } from '../../types';

export const AttendanceOverview: React.FC = () => {
  const { attendanceRecords, loading, fetchAttendanceRecords, updateAttendanceRecord, deleteAttendanceRecord } = useAdmin();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedSelfie, setSelectedSelfie] = useState<string | null>(null);
  const [selfieTitle, setSelfieTitle] = useState<string>('');
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<AttendanceRecord>>({});

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (viewMode === 'daily') {
      fetchAttendanceRecords(date, date);
    }
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    if (viewMode === 'monthly') {
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;
      fetchAttendanceRecords(startDate, endDate);
    }
  };

  const handleViewModeChange = (mode: 'daily' | 'monthly') => {
    setViewMode(mode);
    if (mode === 'daily') {
      fetchAttendanceRecords(selectedDate, selectedDate);
    } else {
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;
      fetchAttendanceRecords(startDate, endDate);
    }
  };

  // Add effect to automatically load data on component mount and refresh periodically
  useEffect(() => {
    // Initial load based on current view mode
    if (viewMode === 'daily') {
      fetchAttendanceRecords(selectedDate, selectedDate);
    } else {
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;
      fetchAttendanceRecords(startDate, endDate);
    }

    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(() => {
      if (viewMode === 'daily') {
        fetchAttendanceRecords(selectedDate, selectedDate);
      } else {
        const startDate = `${selectedMonth}-01`;
        const endDate = `${selectedMonth}-31`;
        fetchAttendanceRecords(startDate, endDate);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [viewMode, selectedDate, selectedMonth]);

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleEdit = (record: AttendanceRecord) => {
    setEditingRecord(record.id);
    setEditData({
      check_in_1: record.check_in_1 ? new Date(record.check_in_1).toISOString().slice(0, 16) : '',
      check_out_1: record.check_out_1 ? new Date(record.check_out_1).toISOString().slice(0, 16) : '',
      check_in_2: record.check_in_2 ? new Date(record.check_in_2).toISOString().slice(0, 16) : '',
      check_out_2: record.check_out_2 ? new Date(record.check_out_2).toISOString().slice(0, 16) : '',
      calculated_work_hours: record.calculated_work_hours,
      calculated_salary: record.calculated_salary,
    });
  };

  const handleSave = async () => {
    if (editingRecord && editData) {
      // Convert datetime-local back to ISO string
      const updates = {
        ...editData,
        check_in_1: editData.check_in_1 ? new Date(editData.check_in_1).toISOString() : null,
        check_out_1: editData.check_out_1 ? new Date(editData.check_out_1).toISOString() : null,
        check_in_2: editData.check_in_2 ? new Date(editData.check_in_2).toISOString() : null,
        check_out_2: editData.check_out_2 ? new Date(editData.check_out_2).toISOString() : null,
      };
      
      const { error } = await updateAttendanceRecord(editingRecord, updates);
      
      if (error) {
        alert('Error updating record: ' + (error as Error).message);
      } else {
        setEditingRecord(null);
        setEditData({});
      }
    }
  };

  const handleCancel = () => {
    setEditingRecord(null);
    setEditData({});
  };

  const handleDelete = async (id: string, employeeName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data absensi ${employeeName}?`)) {
      const { error } = await deleteAttendanceRecord(id);
      
      if (error) {
        alert('Error deleting record: ' + (error as Error).message);
      }
    }
  };

  const openSelfie = (imageData: string, title: string) => {
    setSelectedSelfie(imageData);
    setSelfieTitle(title);
  };

  const closeSelfie = () => {
    setSelectedSelfie(null);
    setSelfieTitle('');
  };
  const filteredRecords = attendanceRecords.filter(record => {
    if (viewMode === 'daily') {
      return record.date === selectedDate;
    } else {
      return record.date.startsWith(selectedMonth);
    }
  });

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overview Absensi</h1>
          <p className="text-gray-600">Pantau absensi karyawan secara real-time</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleViewModeChange('daily')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'daily'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Harian
            </button>
            <button
              onClick={() => handleViewModeChange('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bulanan
            </button>
          </div>
          
          {viewMode === 'daily' ? (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          ) : (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-pink-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Absensi</p>
              <p className="text-2xl font-bold text-gray-900">{filteredRecords.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Jam Kerja</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredRecords.reduce((sum, record) => sum + (record.calculated_work_hours || 0), 0).toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Gaji</p>
              <p className="text-2xl font-bold text-gray-900">
                Rp {filteredRecords.reduce((sum, record) => sum + (record.calculated_salary || 0), 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Karyawan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shift
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jam Masuk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jam Keluar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Jam
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gaji
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Selfie
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {record.employee?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {record.employee?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {viewMode === 'daily' ? formatDate(record.date) : record.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                      {record.shift?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingRecord === record.id ? (
                      <div className="space-y-2">
                        <input
                          type="datetime-local"
                          value={editData.check_in_1 || ''}
                          onChange={(e) => setEditData({ ...editData, check_in_1: e.target.value })}
                          className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                          placeholder="Masuk 1"
                        />
                        {editData.check_in_2 !== undefined && (
                          <input
                            type="datetime-local"
                            value={editData.check_in_2 || ''}
                            onChange={(e) => setEditData({ ...editData, check_in_2: e.target.value })}
                            className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                            placeholder="Masuk 2"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {record.check_in_1 && (
                          <div>Sesi 1: {formatTime(record.check_in_1)}</div>
                        )}
                        {record.check_in_2 && (
                          <div>Sesi 2: {formatTime(record.check_in_2)}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingRecord === record.id ? (
                      <div className="space-y-2">
                        <input
                          type="datetime-local"
                          value={editData.check_out_1 || ''}
                          onChange={(e) => setEditData({ ...editData, check_out_1: e.target.value })}
                          className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                          placeholder="Keluar 1"
                        />
                        {editData.check_out_2 !== undefined && (
                          <input
                            type="datetime-local"
                            value={editData.check_out_2 || ''}
                            onChange={(e) => setEditData({ ...editData, check_out_2: e.target.value })}
                            className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                            placeholder="Keluar 2"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {record.check_out_1 && (
                          <div>Sesi 1: {formatTime(record.check_out_1)}</div>
                        )}
                        {record.check_out_2 && (
                          <div>Sesi 2: {formatTime(record.check_out_2)}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {editingRecord === record.id ? (
                      <input
                        type="number"
                        step="0.1"
                        value={editData.calculated_work_hours || ''}
                        onChange={(e) => setEditData({ ...editData, calculated_work_hours: parseFloat(e.target.value) })}
                        className="w-20 text-xs px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      `${record.calculated_work_hours?.toFixed(1)} jam`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {editingRecord === record.id ? (
                      <input
                        type="number"
                        value={editData.calculated_salary || ''}
                        onChange={(e) => setEditData({ ...editData, calculated_salary: parseInt(e.target.value) })}
                        className="w-24 text-xs px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      `Rp ${record.calculated_salary?.toLocaleString('id-ID')}`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
                      {record.selfie_check_in_1 && (
                        <button
                          onClick={() => openSelfie(record.selfie_check_in_1!, `${record.employee?.name} - Masuk Sesi 1`)}
                          className="p-1 text-pink-600 hover:text-pink-800 hover:bg-pink-50 rounded transition-colors"
                          title="Selfie Masuk 1"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      )}
                      {record.selfie_check_out_1 && (
                        <button
                          onClick={() => openSelfie(record.selfie_check_out_1!, `${record.employee?.name} - ${record.shift?.has_break ? 'Istirahat' : 'Pulang'} Sesi 1`)}
                          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                          title="Selfie Keluar 1"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      )}
                      {record.selfie_check_in_2 && (
                        <button
                          onClick={() => openSelfie(record.selfie_check_in_2!, `${record.employee?.name} - Masuk Sesi 2`)}
                          className="p-1 text-pink-600 hover:text-pink-800 hover:bg-pink-50 rounded transition-colors"
                          title="Selfie Masuk 2"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      )}
                      {record.selfie_check_out_2 && (
                        <button
                          onClick={() => openSelfie(record.selfie_check_out_2!, `${record.employee?.name} - Pulang Sesi 2`)}
                          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                          title="Selfie Keluar 2"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      )}
                      {!record.selfie_check_in_1 && !record.selfie_check_out_1 && !record.selfie_check_in_2 && !record.selfie_check_out_2 && (
                        <span className="text-xs text-gray-400 px-2 py-1">Tidak ada foto</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingRecord === record.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSave}
                          className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                          title="Simpan"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                          title="Batal"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-1 text-pink-600 hover:text-pink-900 hover:bg-pink-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id, record.employee?.name || 'Unknown')}
                          className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selfie Modal */}
      {selectedSelfie && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={closeSelfie}
        >
          <div 
            className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Foto Selfie</h3>
                <p className="text-sm text-gray-600">{selfieTitle}</p>
              </div>
              <button
                onClick={closeSelfie}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative">
              <img
                src={selectedSelfie}
                alt="Selfie"
                className="w-full rounded-lg shadow-lg"
                style={{ maxHeight: '70vh', objectFit: 'contain' }}
              />
              <div className="absolute top-2 right-2">
                <button
                  onClick={() => window.open(selectedSelfie, '_blank')}
                  className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-lg transition-all"
                  title="Buka di tab baru"
                >
                  <ZoomIn className="w-4 h-4 text-gray-700" />
                </button>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = selectedSelfie;
                  link.download = `selfie-${selfieTitle.replace(/\s+/g, '-').toLowerCase()}.jpg`;
                  link.click();
                }}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                Download Foto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};