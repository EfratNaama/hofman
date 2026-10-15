import { render, screen, fireEvent } from '@testing-library/react';
import UserForm from './UserForm';
jest.mock('react-router-dom', () => ({ Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a> }), { virtual: true });
const fields = { fullName: 'Test User', email: 'test@example.com', phone: '0501234567', role: 'resident', status: 'active' };

test.each([
  ['fullName', '   ', 'יש להזין שם מלא תקין'],
  ['fullName', '123--', 'יש להזין שם מלא תקין'],
  ...['', 'examplegmail.com', 'example@', 'example@gmail', 'ex ample@gmail.com', 'a..b@example.com', 'a@-example.com'].map((value) => ['email', value, 'יש להזין כתובת אימייל תקינה']),
  ...['', '050123456', '05012345678', '0591234567', '0101234567', '050abc4567', '++972501234567'].map((value) => ['phone', value, 'יש להזין מספר טלפון תקין']),
])('blocks invalid %s (%s) and clears its error after correction', (name, value, message) => {
  const submit = jest.fn();
  render(<UserForm isCreating initialValues={{ ...fields, [name]: value }} onSubmit={submit} submitLabel="Create" />);
  fireEvent.click(screen.getByRole('button', { name: 'Create' }));
  expect(submit).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toHaveTextContent(message);
  const labels = { fullName: /^שם מלא/, email: /^אימייל/, phone: /^טלפון/ };
  const input = screen.getByRole('textbox', { name: labels[name] });
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveFocus();
  fireEvent.change(input, { target: { value: fields[name] } });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Create' }));
  expect(submit).toHaveBeenCalledTimes(1);
});

test.each(['0501234567', '050-123 4567', '+972 50-1234567', '021234567', '+972-2-1234567', '0771234567'])(
  'accepts Israeli phone %s, legitimate names, email whitespace and an optional empty date', (phone) => {
    const submit = jest.fn();
    const values = { ...fields, fullName: "שרה O’Neil-כהן", email: ' user+tag@mail.example.co.il ', phone };
    render(<UserForm isCreating initialValues={values} onSubmit={submit} submitLabel="Create" />);
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(submit).toHaveBeenCalledWith({ ...values, createdAt: '' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  }
);

test('shows all required field errors and preserves entered values on rejection', () => {
  const submit = jest.fn();
  render(<UserForm isCreating initialValues={{ fullName: '123', email: 'invalid', phone: 'abc' }} onSubmit={submit} submitLabel="Create" />);
  fireEvent.click(screen.getByRole('button', { name: 'Create' }));
  expect(screen.getAllByRole('alert')).toHaveLength(3);
  expect(screen.getByRole('textbox', { name: /^אימייל/ })).toHaveValue('invalid');
  expect(submit).not.toHaveBeenCalled();
});
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
