import { useState } from 'react';
import {
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useApproveUserMutation,
  useRejectUserMutation,
  useDeleteUserMutation,
} from '@/features/admin/userApi';
import { UserRole } from '@/types';
import { useAppSelector } from '@/app/hooks';

export const UserManagement = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetUsersQuery({ page, limit: 10 });
  const [updateRole] = useUpdateUserRoleMutation();
  const [approveUser] = useApproveUserMutation();
  const [rejectUser] = useRejectUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const currentUser = useAppSelector((state) => state.auth.user);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateRole({ id: userId, role: newRole }).unwrap();
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const handleApproveUser = async (userId: string, _userName: string) => {
    try {
      await approveUser(userId).unwrap();
    } catch (error) {
      console.error('Failed to approve user:', error);
    }
  };

  const handleRejectUser = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to reject user ${userName}? They will be removed from the system.`)) {
      try {
        await rejectUser(userId).unwrap();
      } catch (error) {
        console.error('Failed to reject user:', error);
      }
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete user ${userName}? This action cannot be undone.`)) {
      try {
        await deleteUser(userId).unwrap();
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">User Management</h2>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className={!user.is_approved ? 'bg-yellow-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    disabled={user.id === currentUser?.id || !user.is_approved}
                    className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value={UserRole.GUEST}>Guest</option>
                    <option value={UserRole.MEMBER}>Member</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.is_approved ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Approved
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    {!user.is_approved ? (
                      <>
                        <button
                          onClick={() => handleApproveUser(user.id, `${user.first_name} ${user.last_name}`)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectUser(user.id, `${user.first_name} ${user.last_name}`)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDeleteUser(user.id, `${user.first_name} ${user.last_name}`)}
                        disabled={user.id === currentUser?.id}
                        className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
