//main.js
// Initialize charts
let cumulativeChart = null;
let marginChart = null;

// Initialize charts
function initializeCharts() {
    // Destroy existing charts if they exist
    if (cumulativeChart) {
        cumulativeChart.destroy();
    }
    if (marginChart) {
        marginChart.destroy();
    }

    // Initialize Cumulative Chart
    const cumulativeCtx = document.getElementById('cumulativeChart').getContext('2d');
    cumulativeChart = new Chart(cumulativeCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Cumulative Profit',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Cumulative Cost',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Cumulative Revenue',
                    data: [],
                    borderColor: 'rgb(54, 162, 235)',
                    tension: 0.1,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Cumulative Financial Metrics'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => 'R' + value.toFixed(2)
                    }
                }
            }
        }
    });

    // Initialize Margin Chart
    const marginCtx = document.getElementById('marginChart').getContext('2d');
    marginChart = new Chart(marginCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Margin %',
                data: [],
                borderColor: 'rgb(153, 102, 255)',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Margin Trend'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => value.toFixed(1) + '%'
                    }
                }
            }
        }
    });
}

function updateCharts(jobs) {
    // Sort jobs by date
    jobs.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    // Calculate cumulative values
    let cumulativeProfit = 0;
    let cumulativeCost = 0;
    let cumulativeRevenue = 0;

    const labels = [];
    const profitData = [];
    const costData = [];
    const revenueData = [];
    const marginData = [];

    jobs.forEach(job => {
        labels.push(job.start_date);

        cumulativeCost += job.cost;
        cumulativeRevenue += job.invoiced_amount;
        cumulativeProfit += (job.invoiced_amount - job.cost);

        costData.push(cumulativeCost);
        revenueData.push(cumulativeRevenue);
        profitData.push(cumulativeProfit);
        marginData.push(((job.invoiced_amount - job.cost) / job.invoiced_amount * 100) || 0);
    });

    // Update Cumulative Chart
    cumulativeChart.data.labels = labels;
    cumulativeChart.data.datasets[0].data = profitData;
    cumulativeChart.data.datasets[1].data = costData;
    cumulativeChart.data.datasets[2].data = revenueData;
    cumulativeChart.update();

    // Update Margin Chart
    marginChart.data.labels = labels;
    marginChart.data.datasets[0].data = marginData;
    marginChart.update();
}

function updateAnalysisTable(jobs) {
    const tbody = document.querySelector('#analysis-table tbody');
    tbody.innerHTML = '';

    jobs.forEach(job => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${job.job_card_number}</td>
            <td>${job.start_date}</td>
            <td>${job.end_date}</td>
            <td>R${job.cost.toFixed(2)}</td>
            <td>R${job.invoiced_amount.toFixed(2)}</td>
            <td>R${(job.invoiced_amount - job.cost).toFixed(2)}</td>
            <td>${((job.invoiced_amount - job.cost) / job.invoiced_amount * 100 || 0).toFixed(1)}%</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateAnalysisSummary(summary) {
    document.getElementById('summary-total-jobs').textContent = summary.total_jobs;
    document.getElementById('summary-total-cost').textContent = `R${summary.total_cost.toFixed(2)}`;
    document.getElementById('summary-total-invoiced').textContent = `R${summary.total_invoiced.toFixed(2)}`;
    document.getElementById('summary-total-profit').textContent = `R${summary.total_profit.toFixed(2)}`;
    document.getElementById('summary-average-margin').textContent = `${summary.average_margin.toFixed(1)}%`;
}

// Global functions
function generateAnalysis() {
    console.log('Generating analysis...');  // Debug log
    const employee = document.getElementById('analysis-employee').value;
    const startDate = document.getElementById('analysis-start-date').value;
    const endDate = document.getElementById('analysis-end-date').value;

    console.log('Selected values:', { employee, startDate, endDate });  // Debug log

    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }

    const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
    });

    if (employee) {
        params.append('employee_id', employee);
    }

    const url = `/api/analysis?${params.toString()}`;
    console.log('Fetching from URL:', url);  // Debug log

    fetch(url)
        .then(response => {
            console.log('Response received:', response);  // Debug log
            return response.json();
        })
        .then(data => {
            console.log('Data received:', data);  // Debug log
            if (data.success) {
                updateAnalysisTable(data.jobs);
                updateAnalysisSummary(data.summary);
                updateCharts(data.jobs);
            } else {
                alert(data.message || 'Error generating analysis');
            }
        })
        .catch(error => {
            console.error('Error generating analysis:', error);
            alert('Error generating analysis. Please try again.');
        });
}

// Document ready handler
document.addEventListener('DOMContentLoaded', function() {
    // Initialize datepicker for job form
    flatpickr('.datepicker', {
        enableTime: false,
        dateFormat: 'Y-m-d'
    });

    // Load initial data
    loadTodaysJobs();
    loadEmployees();
    loadTeams();
    loadDescriptions();

    // Initialize charts
    initializeCharts();

    // Add tab change event listener to reinitialize charts when analysis tab is shown
    document.querySelector('#analysis-tab').addEventListener('shown.bs.tab', function (e) {
        initializeCharts();
    });

    // Event listeners for job status updates
    ['starting-jobs', 'finishing-jobs', 'overdue-jobs'].forEach(tableId => {
        document.getElementById(tableId)?.addEventListener('click', function(e) {
            if (e.target.classList.contains('status-button')) {
                updateJobStatus(e.target.dataset.jobId, e.target.value, e.target.dataset.currentStatus);
            }
        });
    });

    // Event listeners for form submissions
    document.getElementById('add-job-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        submitJob(this);
    });

    document.getElementById('add-employee-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());

        fetch('/api/employee', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                this.reset();
                loadEmployeesTable();
                loadEmployees(); // Reload dropdowns
            }
        })
        .catch(error => {
            console.error('Error adding employee:', error);
            alert('Error adding employee. Please try again.');
        });
    });

    document.getElementById('add-team-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());

        fetch('/api/team', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                this.reset();
                loadTeamsTable();
                loadTeams(); // Reload dropdowns
            }
        })
        .catch(error => {
            console.error('Error adding team:', error);
            alert('Error adding team. Please try again.');
        });
    });

    document.getElementById('add-description-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());

        fetch('/api/description', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                this.reset();
                loadDescriptionsTable();
                loadDescriptions(); // Reload dropdowns
            }
        })
        .catch(error => {
            console.error('Error adding description:', error);
            alert('Error adding description. Please try again.');
        });
    });

    // Analysis form submission
    document.getElementById('analysis-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Analysis form submitted');  // Debug log
        generateAnalysis();
    });

    // Load manage tab data when shown
    document.querySelector('#manage-tab').addEventListener('shown.bs.tab', function() {
        loadEmployeesTable();
        loadDescriptionsTable();
        loadTeamsTable();
    });



    // Delete employee handler
    document.querySelector('#employees-table')?.addEventListener('click', function(e) {
        if (e.target.closest('.delete-employee')) {
            const button = e.target.closest('.delete-employee');
            const employeeId = button.dataset.id;
            if (confirm('Are you sure you want to delete this employee?')) {
                fetch(`/api/employee/${employeeId}`, {
                    method: 'DELETE'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        alert(data.message);
                        loadEmployeesTable();
                        loadEmployees(); // Reload dropdowns
                    }
                })
                .catch(error => {
                    console.error('Error deleting employee:', error);
                    alert('Error deleting employee. Please try again.');
                });
            }
        }
    });


    // Delete team handler
    document.querySelector('#teams-table')?.addEventListener('click', function(e) {
        if (e.target.closest('.delete-team')) {
            const button = e.target.closest('.delete-team');
            const teamId = button.dataset.id;
            if (confirm('Are you sure you want to delete this team?')) {
                fetch(`/api/team/${teamId}`, {
                    method: 'DELETE'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        alert(data.message);
                        loadTeamsTable();
                        loadTeams(); // Reload dropdowns
                    }
                })
                .catch(error => {
                    console.error('Error deleting team:', error);
                    alert('Error deleting team. Please try again.');
                });
            }
        }
    });

    // Delete description handler
    document.querySelector('#descriptions-table')?.addEventListener('click', function(e) {
        if (e.target.closest('.delete-description')) {
            const button = e.target.closest('.delete-description');
            const descriptionId = button.dataset.id;
            if (confirm('Are you sure you want to delete this description?')) {
                fetch(`/api/description/${descriptionId}`, {
                    method: 'DELETE'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        alert(data.message);
                        loadDescriptionsTable();
                        loadDescriptions(); // Reload dropdowns
                    }
                })
                .catch(error => {
                    console.error('Error deleting description:', error);
                    alert('Error deleting description. Please try again.');
                });
            }
        }
    });
});

function loadTodaysJobs() {
    fetch('/api/jobs/today')
        .then(response => response.json())
        .then(data => {
            updateJobTable('starting-jobs', data.starting);
            updateJobTable('finishing-jobs', data.finishing);
            updateJobTable('overdue-jobs', data.overdue);
        })
        .catch(error => console.error('Error loading jobs:', error));
}

function loadEmployees() {
    fetch('/api/employees')
        .then(response => response.json())
        .then(employees => {
            // Update job form employee dropdown
            const jobFormSelects = document.querySelectorAll('select[name="employee_id"]');
            jobFormSelects.forEach(select => {
                select.innerHTML = '<option value="">Select Employee</option>' +
                    employees.map(emp => `<option value="${emp.id}">${emp.name}</option>`).join('');
            });

            // Update analysis employee dropdown
            const analysisSelect = document.getElementById('analysis-employee');
            if (analysisSelect) {
                analysisSelect.innerHTML = '<option value="">All Employees</option>' +
                    employees.map(emp => `<option value="${emp.id}">${emp.name}</option>`).join('');
            }
        })
        .catch(error => console.error('Error loading employees:', error));
}


function loadTeams() {
    fetch('/api/teams')
        .then(response => response.json())
        .then(teams => {
            // Update job form employee dropdown
            const jobFormSelects = document.querySelectorAll('select[name="team_id"]');
            jobFormSelects.forEach(select => {
                select.innerHTML = '<option value="">Select Team</option>' +
                    teams.map(emp => `<option value="${emp.id}">${emp.name}</option>`).join('');
            });

            // Update analysis employee dropdown
            const analysisSelect = document.getElementById('analysis-team');
            if (analysisSelect) {
                analysisSelect.innerHTML = '<option value="">All Teams</option>' +
                    teams.map(emp => `<option value="${emp.id}">${emp.name}</option>`).join('');
            }
        })
        .catch(error => console.error('Error loading teams:', error));
}

function loadDescriptions() {
    fetch('/api/descriptions')
        .then(response => response.json())
        .then(descriptions => {
            const selects = document.querySelectorAll('select[name="description_id"]');
            selects.forEach(select => {
                select.innerHTML = '<option value="">Select Description</option>' +
                    descriptions.map(desc => `<option value="${desc.id}">${desc.description}</option>`).join('');
            });
        })
        .catch(error => console.error('Error loading descriptions:', error));
}

function loadEmployeesTable() {
    fetch('/api/employees')
        .then(response => response.json())
        .then(employees => {
            const tbody = document.querySelector('#employees-table tbody');
            tbody.innerHTML = '';
            employees.forEach(emp => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${emp.name}</td>
                    <td>${emp.email}</td>
                    <td>${emp.phone}</td>
                    <td>
                        <button class="btn btn-sm btn-danger delete-employee" data-id="${emp.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => console.error('Error loading employees:', error));
}

function loadTeamsTable() {
    fetch('/api/teams')
        .then(response => response.json())
        .then(teams => {
            const tbody = document.querySelector('#teams-table tbody');
            tbody.innerHTML = '';
            teams.forEach(emp => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${emp.name}</td>
                    <td>
                        <button class="btn btn-sm btn-danger delete-team" data-id="${emp.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => console.error('Error loading teams:', error));
}


function loadDescriptionsTable() {
    fetch('/api/descriptions')
        .then(response => response.json())
        .then(descriptions => {
            const tbody = document.querySelector('#descriptions-table tbody');
            tbody.innerHTML = '';
            descriptions.forEach(desc => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${desc.description}</td>
                    <td>${desc.category || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-danger delete-description" data-id="${desc.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => console.error('Error loading descriptions:', error));
}

function updateJobTable(tableId, jobs) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = '';

    jobs.forEach(job => {
        const tr = document.createElement('tr');
        tr.classList.add(`status-${job.status}`);

        tr.innerHTML = `
            <td>${job.job_card_number}</td>
            <td>${job.employee}</td>
            <td>${job.description}</td>
            <td>${job.start_date}</td>
            <td>${job.end_date}</td>
            <td>
                <select class="form-select status-button" data-job-id="${job.id}" data-current-status="${job.status}">
                    <option value="pending" ${job.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="started" ${job.status === 'started' ? 'selected' : ''}>Started</option>
                    <option value="finished" ${job.status === 'finished' ? 'selected' : ''}>Finished</option>
                    <option value="canceled" ${job.status === 'canceled' ? 'selected' : ''}>Canceled</option>
                </select>
            </td>
            <td>${job.cost.toFixed(2)}</td>
            <td>${job.invoiced_amount.toFixed(2)}</td>
            <td>${job.profit.toFixed(2)}</td>
            <td>${job.margin.toFixed(2)}%</td>
        `;

        tbody.appendChild(tr);

        // Add change event listener to the status select
        const statusSelect = tr.querySelector('.status-button');
        statusSelect.addEventListener('change', function() {
            updateJobStatus(this.dataset.jobId, this.value, this.dataset.currentStatus);
        });
    });
}

function updateJobStatus(jobId, newStatus, currentStatus) {
    // If trying to set the same status, ignore
    if (newStatus === currentStatus) {
        return;
    }

    let data = {
        job_id: jobId,
        status: newStatus
    };

    if (newStatus === 'finished') {
        const actualCost = prompt('Please enter the actual cost:');
        if (actualCost === null) {
            // User canceled, revert the select to previous value
            const select = document.querySelector(`[data-job-id="${jobId}"]`);
            select.value = currentStatus;
            return;
        }
        if (isNaN(actualCost) || actualCost === '') {
            alert('Please enter a valid number for actual cost');
            // Revert the select to previous value
            const select = document.querySelector(`[data-job-id="${jobId}"]`);
            select.value = currentStatus;
            return;
        }
        data.actual_cost = parseFloat(actualCost);
    }

    fetch('/api/job/status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update the current-status attribute
            const select = document.querySelector(`[data-job-id="${jobId}"]`);
            select.dataset.currentStatus = newStatus;

            // Update row styling
            const row = select.closest('tr');
            row.className = `status-${newStatus}`;

            // Reload the jobs to get updated calculations
            loadTodaysJobs();
        } else {
            alert(data.message || 'Error updating job status');
            // Revert the select to previous value
            const select = document.querySelector(`[data-job-id="${jobId}"]`);
            select.value = currentStatus;
        }
    })
    .catch(error => {
        console.error('Error updating job status:', error);
        alert('Error updating job status. Please try again.');
        // Revert the select to previous value
        const select = document.querySelector(`[data-job-id="${jobId}"]`);
        select.value = currentStatus;
    });
}

function submitJob(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    fetch('/api/job', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert(data.message);
            form.reset();
            loadTodaysJobs();
        }
    })
    .catch(error => {
        console.error('Error adding job:', error);
        alert('Error adding job. Please try again.');
    });
}
