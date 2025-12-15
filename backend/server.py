from flask import Flask, jsonify, request
from flask_cors import CORS 
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin, login_user, logout_user, current_user, login_required, LoginManager
from werkzeug.security import generate_password_hash, check_password_hash
from flask_admin import Admin, AdminIndexView
import datetime

app = Flask(__name__)
CORS(app, origins='http://localhost:3000', supports_credentials=True)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SECRET_KEY'] = "very secret"

db = SQLAlchemy(app)

login_manager = LoginManager()



class user(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))

    def set_password(self, pw):
        self.password_hash = generate_password_hash(pw)

    def check_password(self, pw):
        return check_password_hash(self.password_hash, pw)

class group_members(db.Model):
    user_id = db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True)
    group_id = db.Column('group_id', db.Integer, db.ForeignKey('group.id'), primary_key=True)

    user = db.relationship('user', backref=db.backref('memberships', cascade='all, delete-orphan'))
    group = db.relationship('group', backref=db.backref('group_members', cascade='all, delete-orphan'))

class group(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(200))

    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    creator = db.relationship('user', backref='created_groups')


class post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    description = db.Column(db.String(200))
    time_posted = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    deadline = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), nullable=False)


    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    creator = db.relationship('user', backref='posted_tasks') 

    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=False)
    group_rel = db.relationship('group', backref='tasks') 


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    cur_user = user.query.filter_by(username=data["username"]).first()

    if not cur_user or not cur_user.check_password(data["password"]):
        return jsonify(url_for(login)), 401
    
    login_user(cur_user)
    return jsonify('Login Successful')

@app.route("/logout", methods=["POST"])
def logout():
    logout_user()
    return jsonify('Logout Successful'), 200



if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    login_manager.init_app(app)
    app.run(debug=True, port=5000)