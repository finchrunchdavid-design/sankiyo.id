import React, { useState } from 'react';
import { Clock, Edit, Save, X } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { Shift } from '../../types';

export const ShiftManagement: React.FC = () => {
  const { shifts, loading, updateShift, fetchShifts } = useAdmin();
  const [editingShift, setEditingShift] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Shift>>({});

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift.id);
    setEditData({
      ...shift,
      start_time_1: shift.start_time_1,
      end_time_1: shift.end_time_1,
      start_time_2: shift.start_time_2,
      end_time_2: shift.end_time_2,
      expected_hours: shift.expected_hours,
      has_break: shift.has_break
    });
  };

  const handleSave = async () => {
    if (editingShift && editData) {
      try {
        console.log('Saving shift with data:', editData);
        const { error } = await updateShift(editingShift, editData);
        if (error) {
          console.error('Error updating shift:', error);
          alert('Gagal mengupdate shift: ' + error.message);
        } else {
          console.log('Shift updated successfully');
          setEditingShift(null);
          setEditData({});
        }
      } catch (error) {
        console.error('Error updating shift:', error);
        alert('Terjadi kesalahan saat mengupdate shift');
      } finally {
        // Always refresh shifts data to sync with database
        await fetchShifts();
      }
    }
  };

  const handleCancel = () => {
    setEditingShift(null);
    setEditData({});
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Remove seconds
  };

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Manajemen Shift</h1>
        <p className="text-gray-600">Kelola jadwal shift karyawan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shifts.map((shift) => (
          <div key={shift.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-pink-100 p-3 rounded-lg mr-4">
                  <Clock className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{shift.name}</h3>
                  <p className="text-sm text-gray-500">
                    {shift.has_break ? 'Dengan istirahat' : 'Tanpa istirahat'}
                  </p>
                </div>
              </div>
              
              {editingShift === shift.id ? (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="p-2 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleEdit(shift)}
                  className="p-2 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Session 1 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Sesi 1</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jam Masuk
                    </label>
                    {editingShift === shift.id ? (
                      <input
                        type="time"
                        value={formatTime(editData.start_time_1 || shift.start_time_1)}
                        onChange={(e) => setEditData({ ...editData, start_time_1: e.target.value + ':00' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg">
                        {formatTime(shift.start_time_1)}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jam Keluar
                    </label>
                    {editingShift === shift.id ? (
                      <input
                        type="time"
                        value={formatTime(editData.end_time_1 || shift.end_time_1)}
                        onChange={(e) => setEditData({ ...editData, end_time_1: e.target.value + ':00' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg">
                        {formatTime(shift.end_time_1)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Session 2 (if has break) */}
              {shift.has_break && shift.start_time_2 && shift.end_time_2 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Sesi 2</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jam Masuk
                      </label>
                      {editingShift === shift.id ? (
                        <input
                          type="time"
                          value={formatTime(editData.start_time_2 || shift.start_time_2)}
                          onChange={(e) => setEditData({ ...editData, start_time_2: e.target.value + ':00' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg">
                          {formatTime(shift.start_time_2)}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jam Keluar
                      </label>
                      {editingShift === shift.id ? (
                        <input
                          type="time"
                          value={formatTime(editData.end_time_2 || shift.end_time_2)}
                          onChange={(e) => setEditData({ ...editData, end_time_2: e.target.value + ':00' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg">
                          {formatTime(shift.end_time_2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Pengaturan</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Jam Kerja
                    </label>
                    {editingShift === shift.id ? (
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={editData.expected_hours || shift.expected_hours}
                        onChange={(e) => setEditData({ ...editData, expected_hours: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg">
                        {shift.expected_hours} jam
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Istirahat
                    </label>
                    {editingShift === shift.id ? (
                      <select
                        value={(editData.has_break !== undefined ? editData.has_break : shift.has_break) ? 'true' : 'false'}
                        onChange={(e) => setEditData({ ...editData, has_break: e.target.value === 'true' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        <option value="true">Ada istirahat</option>
                        <option value="false">Tanpa istirahat</option>
                      </select>
                    ) : (
                      <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg">
                        {shift.has_break ? 'Ada istirahat' : 'Tanpa istirahat'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};