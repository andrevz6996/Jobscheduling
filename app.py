# app.py
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///jobscheduling1.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


# Models
class Employee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    jobs = db.relationship('Job', backref='employee', lazy=True)


class Team(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)


class employee_teams(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('team.id'),nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'),nullable=False)


class Description(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), unique=True, nullable=False)
    category = db.Column(db.String(100), nullable=True)
    jobs = db.relationship('Job', backref='job_description', lazy=True)


class Job(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    job_card_number = db.Column(db.String(50), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    description_id = db.Column(db.Integer, db.ForeignKey('description.id'), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default='pending')
    cost = db.Column(db.Float, default=0.0)
    invoiced_amount = db.Column(db.Float, default=0.0)
    profit = db.Column(db.Float, default=0.0)
    margin = db.Column(db.Float, default=0.0)


class Actual(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('job.id'), nullable=False)
    cost = db.Column(db.Float, nullable=False)
    completion_date = db.Column(db.DateTime, nullable=False)




@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/jobs/today')
def get_todays_jobs():
    today = datetime.now().date()

    # Get starting jobs
    starting_jobs = Job.query.filter_by(start_date=today).all()
    finishing_jobs = Job.query.filter_by(end_date=today).all()
    overdue_jobs = Job.query.filter(Job.end_date < today).all()

    return jsonify({
        'starting': [serialize_job(job) for job in starting_jobs],
        'finishing': [serialize_job(job) for job in finishing_jobs],
        'overdue': [serialize_job(job) for job in overdue_jobs]
    })


@app.route('/api/job', methods=['POST'])
def add_job():
    data = request.json

    # Create new job
    new_job = Job(
        job_card_number=data['job_card_number'],
        employee_id=data['employee_id'],
        description_id=data['description_id'],
        start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date(),
        end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date(),
        cost=float(data['cost']),
        invoiced_amount=float(data['invoiced_amount']),
        profit=float(data['invoiced_amount']) - float(data['cost']),
        margin=(float(data['invoiced_amount']) - float(data['cost'])) / float(data['invoiced_amount']) * 100 if float(
            data['invoiced_amount']) > 0 else 0.0
    )

    db.session.add(new_job)
    db.session.commit()

    # Add to Google Calendar
    add_to_calendar(new_job)

    return jsonify({'message': 'Job added successfully', 'job': serialize_job(new_job)})


@app.route('/api/employees')
def get_employees():
    employees = Employee.query.all()
    return jsonify([{'id': e.id, 'name': e.name, 'email': e.email, 'phone': e.phone} for e in employees])

@app.route('/api/teams')
def get_teams():
    team = Team.query.all()
    return jsonify([{'id': e.id, 'name': e.name} for e in team])


@app.route('/api/descriptions')
def get_descriptions():
    descriptions = Description.query.all()
    return jsonify([{'id': d.id, 'description': d.description, 'category': d.category} for d in descriptions])


# Employee management endpoints
@app.route('/api/employee', methods=['POST'])
def add_employee():
    data = request.get_json()
    employee = Employee(
        name=data['name'],
        email=data['email'],
        phone=data['phone']
    )
    db.session.add(employee)
    db.session.commit()
    return jsonify({'message': 'Employee added successfully'})

@app.route('/api/team', methods=['POST'])
def add_team():
    data = request.get_json()
    team = Team(
        name=data['name']
    )
    db.session.add(team)
    db.session.commit()
    return jsonify({'message': 'Team added successfully'})

@app.route('/api/team/<int:team_id>', methods=['DELETE'])
def delete_team(team_id):
    team = Team.query.get_or_404(team_id)
    db.session.delete(team)
    db.session.commit()
    return jsonify({'message': 'Team deleted successfully'})

@app.route('/api/employee/<int:employee_id>', methods=['DELETE'])
def delete_employee(employee_id):
    employee = Employee.query.get_or_404(employee_id)
    db.session.delete(employee)
    db.session.commit()
    return jsonify({'message': 'Employee deleted successfully'})


# Description management endpoints
@app.route('/api/description', methods=['POST'])
def add_description():
    data = request.get_json()
    description = Description(
        description=data['description'],
        category=data.get('category')
    )
    db.session.add(description)
    db.session.commit()
    return jsonify({'message': 'Description added successfully'})


@app.route('/api/description/<int:description_id>', methods=['DELETE'])
def delete_description(description_id):
    description = Description.query.get_or_404(description_id)
    db.session.delete(description)
    db.session.commit()
    return jsonify({'message': 'Description deleted successfully'})


@app.route('/api/analysis')
def get_analysis():
    try:
        print("Analysis endpoint called")  # Debug log

        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        employee_id = request.args.get('employee_id')

        print(
            f"Received parameters: start_date={start_date}, end_date={end_date}, employee_id={employee_id}")  # Debug log

        # Convert string dates to datetime
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()

        print(f"Converted dates: start_date={start_date}, end_date={end_date}")  # Debug log

        # Base query
        query = Job.query.filter(
            Job.start_date >= start_date,
            Job.start_date <= end_date
        )

        # Add employee filter if specified
        if employee_id:
            query = query.filter(Job.employee_id == employee_id)

        print(f"SQL Query: {query}")  # Debug log

        # Get all jobs for the period
        jobs = query.all()
        print(f"Found {len(jobs)} jobs")  # Debug log

        # Calculate summary metrics
        total_jobs = len(jobs)
        total_cost = sum(job.cost for job in jobs)
        total_invoiced = sum(job.invoiced_amount for job in jobs)
        total_profit = total_invoiced - total_cost
        average_margin = (total_profit / total_invoiced * 100) if total_invoiced > 0 else 0

        print(
            f"Summary: total_jobs={total_jobs}, total_cost={total_cost}, total_invoiced={total_invoiced}")  # Debug log

        # Format jobs for JSON response
        jobs_data = [{
            'job_card_number': job.job_card_number,
            'start_date': job.start_date.strftime('%Y-%m-%d'),
            'end_date': job.end_date.strftime('%Y-%m-%d') if job.end_date else None,
            'cost': float(job.cost),
            'invoiced_amount': float(job.invoiced_amount),
            'status': job.status
        } for job in jobs]

        response_data = {
            'success': True,
            'jobs': jobs_data,
            'summary': {
                'total_jobs': total_jobs,
                'total_cost': float(total_cost),
                'total_invoiced': float(total_invoiced),
                'total_profit': float(total_profit),
                'average_margin': float(average_margin)
            }
        }

        print(f"Sending response: {response_data}")  # Debug log
        return jsonify(response_data)

    except Exception as e:
        print(f"Error in analysis: {str(e)}")
        import traceback
        print(traceback.format_exc())  # Print full stack trace
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/api/job/status', methods=['POST'])
def update_job_status():
    try:
        data = request.get_json()
        job_id = data.get('job_id')
        new_status = data.get('status')
        actual_cost = data.get('actual_cost')

        if not job_id or not new_status:
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400

        job = Job.query.get_or_404(job_id)

        # Validate status transition
        valid_transitions = {
            'pending': ['started', 'canceled'],
            'started': ['finished', 'canceled'],
            'finished': [],  # Cannot change status once finished
            'canceled': []  # Cannot change status once canceled
        }

        if job.status in ['finished', 'canceled']:
            return jsonify({
                'success': False,
                'message': f'Cannot change status of a {job.status} job'
            }), 400

        if new_status not in valid_transitions[job.status]:
            return jsonify({
                'success': False,
                'message': f'Invalid status transition from {job.status} to {new_status}'
            }), 400

        # Update job status
        job.status = new_status

        # If job is finished, update actual cost and create Actual record
        if new_status == 'finished' and actual_cost is not None:
            actual = Actual(
                job_id=job.id,
                cost=float(actual_cost),
                completion_date=datetime.now()
            )
            db.session.add(actual)

        db.session.commit()
        return jsonify({'success': True, 'message': 'Job status updated successfully'})

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error updating job status: {str(e)}'
        }), 500


def serialize_job(job):
    return {
        'id': job.id,
        'job_card_number': job.job_card_number,
        'employee': job.employee.name,
        'description': job.job_description.description,
        'start_date': job.start_date.strftime('%Y-%m-%d'),
        'end_date': job.end_date.strftime('%Y-%m-%d'),
        'status': job.status,
        'cost': job.cost,
        'invoiced_amount': job.invoiced_amount,
        'profit': job.profit,
        'margin': job.margin
    }


def add_to_calendar(job):
    SCOPES = ['https://www.googleapis.com/auth/calendar.events']
    creds = None

    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'client_secret.json',
                SCOPES
            )
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    service = build('calendar', 'v3', credentials=creds)

    # Create start event
    start_event = {
        'summary': f"Start: {job.job_card_number}",
        'location': 'Windhoek, Namibia',
        'description': 'Start Job',
        'start': {
            'dateTime': f"{job.start_date}T07:00:00",
            'timeZone': 'Africa/Windhoek',
        },
        'end': {
            'dateTime': f"{job.start_date}T07:30:00",
            'timeZone': 'Africa/Windhoek',
        },
        'reminders': {
            'useDefault': False,
            'overrides': [
                {'method': 'email', 'minutes': 10},
                {'method': 'popup', 'minutes': 10},
            ],
        },
        'colorId': '2'
    }

    # Create end event
    end_event = {
        'summary': f"End: {job.job_card_number}",
        'location': 'Windhoek, Namibia',
        'description': 'End Job',
        'start': {
            'dateTime': f"{job.end_date}T07:30:00",
            'timeZone': 'Africa/Windhoek',
        },
        'end': {
            'dateTime': f"{job.end_date}T08:00:00",
            'timeZone': 'Africa/Windhoek',
        },
        'reminders': {
            'useDefault': False,
            'overrides': [
                {'method': 'email', 'minutes': 10},
                {'method': 'popup', 'minutes': 10},
            ],
        },
        'colorId': '11'
    }

    service.events().insert(calendarId='primary', body=start_event).execute()
    service.events().insert(calendarId='primary', body=end_event).execute()


if __name__ == '__main__':
    with app.app_context():
        # Create tables if they don't exist
        db.create_all()

        # Add initial data only if the tables are empty
        if not Employee.query.first():
            initial_employees = [
                {'name': 'John Smith', 'email': 'john@example.com', 'phone': '0812345678'},
                {'name': 'Sarah Johnson', 'email': 'sarah@example.com', 'phone': '0823456789'},
                {'name': 'Michael Brown', 'email': 'michael@example.com', 'phone': '0834567890'}
            ]
            for employee in initial_employees:
                db.session.add(Employee(**employee))
            db.session.commit()

        if not Description.query.first():
            initial_descriptions = [
                {'description': 'AC Maintenance', 'category': 'Service'},
                {'description': 'Electrical Repair', 'category': 'Repair'},
                {'description': 'Solar Installation', 'category': 'Installation'},
                {'description': 'HVAC Inspection', 'category': 'Inspection'},
                {'description': 'Wiring Installation', 'category': 'Installation'},
                {'description': 'Generator Service', 'category': 'Service'}
            ]
            for desc in initial_descriptions:
                db.session.add(Description(**desc))
            db.session.commit()

        if not Job.query.first():
            print("Seeding 20 random jobs!")
            # Get some references for foreign keys
            employees = Employee.query.all()
            descriptions = Description.query.all()

            # Create jobs over the last 30 days with varying statuses and financials
            from datetime import datetime, timedelta
            import random

            today = datetime.now().date()

            # Generate 20 jobs over the last 30 days
            for i in range(20):
                # Random date within last 30 days
                start_date = today - timedelta(days=random.randint(0, 30))
                end_date = start_date + timedelta(days=random.randint(1, 5))

                # Random employee and description
                employee = random.choice(employees)
                description = random.choice(descriptions)

                # Random financial values
                base_cost = random.uniform(1000, 5000)
                markup = random.uniform(1.2, 1.6)  # 20% to 60% markup
                invoiced_amount = base_cost * markup

                # Random status based on dates
                if end_date < today:
                    status = random.choice(['finished', 'canceled'])
                elif start_date <= today:
                    status = 'started'
                else:
                    status = 'pending'

                job = Job(
                    job_card_number=f'JOB-2024-{i + 1:03d}',
                    employee_id=employee.id,
                    description_id=description.id,
                    start_date=start_date,
                    end_date=end_date,
                    status=status,
                    cost=base_cost,
                    invoiced_amount=invoiced_amount
                )
                db.session.add(job)
                db.session.flush()  # Force INSERT so job.id is assigned

                # If job is finished, add actual cost record
                if status == 'finished':
                    actual_cost = base_cost * random.uniform(0.9, 1.1)  # ±10% variance
                    actual = Actual(
                        job_id=job.id,
                        cost=actual_cost,
                        completion_date=datetime.combine(end_date, datetime.min.time())
                    )
                    db.session.add(actual)

            db.session.commit()

    app.run(debug=True)

if __name__ == '__main__':
    app.run()
