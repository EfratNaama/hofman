import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const TEAL = '#008080';
const ORANGE = '#f28c6f';
const AMBER = '#f0a43c';

const chartCardStyle = {
  minWidth: 0,
  padding: '20px',
  borderRadius: '12px',
  backgroundColor: '#fff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const chartTitleStyle = {
  margin: '0 0 18px',
  color: '#172033',
  fontSize: '1.25rem',
  fontWeight: 900,
};

const truncateTitle = (title = '') => title.length > 15 ? `${title.slice(0, 15)}…` : title;

const formatMonth = (month = '') => {
  const [year, monthNumber] = month.split('-');
  return year && monthNumber ? `${monthNumber}/${year}` : month;
};

const percentageLabel = ({ percent }) => `${Math.round(percent * 100)}%`;

function ChartCard({ title, children }) {
  return (
    <article style={chartCardStyle}>
      <h3 style={chartTitleStyle}>{title}</h3>
      <div style={{ width: '100%', height: '300px' }}>{children}</div>
    </article>
  );
}

function DashboardCharts({
  registrationsPerActivity,
  activityTypeDistribution,
  registrationsOverTime,
  paidVsPendingPerActivity,
}) {
  const registrationChartData = registrationsPerActivity.map((item) => ({
    ...item,
    shortTitle: truncateTitle(item.activityTitle),
  }));
  const timeChartData = registrationsOverTime.map((item) => ({
    ...item,
    displayMonth: formatMonth(item.month),
  }));
  const paymentChartData = paidVsPendingPerActivity.map((item) => ({
    ...item,
    shortTitle: truncateTitle(item.activityTitle),
  }));

  return (
    <div
      dir="rtl"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
        gap: '24px',
      }}
    >
      <ChartCard title="הרשמות לפי פעילות">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={registrationChartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="shortTitle" interval={0} tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(value) => [value, 'מספר הרשמות']} />
            <Bar dataKey="count" name="הרשמות" fill={TEAL} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="סוגי פעילויות">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={activityTypeDistribution}
              dataKey="count"
              nameKey="type"
              cx="50%"
              cy="45%"
              outerRadius={90}
              label={percentageLabel}
            >
              {activityTypeDistribution.map((entry, index) => (
                <Cell key={entry.type} fill={[TEAL, ORANGE][index % 2]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value, 'כמות']} />
            <Legend verticalAlign="bottom" />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="הרשמות לאורך זמן">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timeChartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="displayMonth" />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(value) => [value, 'הרשמות']} labelFormatter={(label) => `חודש: ${label}`} />
            <Line
              type="monotone"
              dataKey="count"
              name="הרשמות"
              stroke={TEAL}
              strokeWidth={3}
              dot={{ r: 4, fill: TEAL }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="שולם / ממתין לפי פעילות">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={paymentChartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="shortTitle" interval={0} tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="paid" name="שולם" stackId="payments" fill={TEAL} />
            <Bar dataKey="pending" name="ממתין" stackId="payments" fill={AMBER} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

export default DashboardCharts;
