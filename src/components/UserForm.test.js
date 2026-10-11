import { render, screen, fireEvent } from '@testing-library/react';
import UserForm from './UserForm';
jest.mock('react-router-dom', () => ({ Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a> }), { virtual: true });
const fields = { fullName: 'Test User', email: 'test@example.com', phone: '0501234567', role: 'resident', status: 'active' };
test('create mode defaults to resident and submits exactly one selected role', () => {
  const submit = jest.fn();
  render(<UserForm isCreating initialValues={fields} onSubmit={submit} submitLabel="Create" />);
  const roles = screen.getAllByRole('radio').filter((radio) => radio.name === 'role');
  expect(roles).toHaveLength(3);
  expect(roles[0]).toBeChecked();
  for (const role of roles) {
    fireEvent.click(role);
    expect(roles.filter((option) => option.checked)).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(submit).toHaveBeenLastCalledWith(expect.objectContaining({ role: role.value, fullName: fields.fullName, status: 'active' }));
  }
});
test('edit mode hides role choices while preserving role and status editing', () => {
  const submit = jest.fn();
  render(<UserForm initialValues={{ ...fields, role: 'admin' }} onSubmit={submit} submitLabel="Save" />);
  const radios = screen.getAllByRole('radio');
  expect(radios).toHaveLength(2);
  expect(radios.every((radio) => radio.name === 'status')).toBe(true);
  fireEvent.click(radios.find((radio) => radio.value === 'inactive'));
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(submit).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin', status: 'inactive' }));
});
