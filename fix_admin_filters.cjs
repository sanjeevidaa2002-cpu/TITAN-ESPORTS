const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf-8');

const newOptions = `
                    <option value="all">All Statuses</option>
                    <option value="pending_verification">Pending Approval</option>
                    <option value="pending">Pending (Checkout)</option>
                    <option value="completed">Approved</option>
                    <option value="completed">Success / Completed</option>
                    <option value="cancelled">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="failed">Failed</option>
`;

code = code.replace(/<option value="all">All Statuses<\/option>[\s\S]*?<option value="failed">Failed<\/option>/, newOptions);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
