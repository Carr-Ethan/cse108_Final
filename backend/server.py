from flask import Flask, jsonify, request
from flask_cors import CORS 
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin, login_user, logout_user, current_user, login_required, LoginManager
from werkzeug.security import generate_password_hash, check_password_hash
from flask_admin import Admin, AdminIndexView
from datetime import datetime

app = Flask(__name__)
CORS(app, origins='http://localhost:3000', supports_credentials=True)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SECRET_KEY'] = "very secret"

db = SQLAlchemy(app)

login_manager = LoginManager()

@login_manager.user_loader
def load_user(id):
    return user.query.get(id)

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
    time_posted = db.Column(db.DateTime, default=datetime.now(), nullable=False)
    deadline = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default="in progress", nullable=False)


    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    creator = db.relationship('user', backref='posted_tasks') 

    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=False)
    group_rel = db.relationship('group', backref='tasks') 


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    cur_user = user.query.filter_by(username=username).first()

    if not cur_user or not cur_user.check_password(password):
        return jsonify("Invalid User"), 401
    
    login_user(cur_user)
    return jsonify('Login Successful'), 200

@app.route("/logout", methods=["POST"])
def logout():
    logout_user()
    return jsonify('Logout Successful'), 200


#return usersname
@app.route("/me", methods=["GET"])
@login_required
def get_role():
    cur_user = user.query.filter_by(id=current_user.id).first()
    if not cur_user:
        return jsonify('Not a Valid User'), 400
    result={
        "name": cur_user.username
    }
    return jsonify(result), 200

# Creates a new user
@app.route("/user", methods=["POST"])
def create_user():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify('Invalid Input'), 400

    usr = user.query.filter_by(username=username).first()
    if usr:
        return jsonify('Username is Taken'), 403
    new_user = user(username=username)
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()
    return jsonify("User is successfully created"), 201

"""GROUP ENDPOINTS"""


# Creates a new group
@app.route("/groups", methods=["POST"])
@login_required
def new_group():
    data = request.json
    name = data.get("name")
    description = data.get("description")

    if not name:
        return jsonify('Invalid Input'), 400

    grp = group.query.filter_by(name=name).first()
    
    if grp:
        return jsonify('Name is Taken'), 403

    new_group = group(name=name, description=description, creator_id=current_user.id)

    db.session.add(new_group)
    db.session.commit()
    return jsonify("Group is successfully created"), 201


# Returns all available groups
@app.route("/groups", methods=["GET"])
@login_required
def get_groups():
    all_groups = group.query.all()
    result = []
    for g in all_groups:
        result.append({
            'name' : g.name,
            'description' : g.description,
            'creator_name' : user.query.filter_by(id = g.creator_id).first().username
        })
    return jsonify(result), 200

 
# Find all of my groups
@app.route("/mygroups", methods=["GET"])
@login_required
def get_my_groups():
    my_groups = group_members.query.filter_by(user_id = current_user.id).all()
    result = []
    for g in my_groups:
        mygroup = group.query.filter_by(id = g.group_id).first()
        result.append({
            'name' : mygroup.name,
            'description' : mygroup.description,
            'creator_name' : user.query.filter_by(id = mygroup.creator_id).first().username
        })
    return jsonify(result), 200

# Join a group
@app.route("/groups/<string:group_name>", methods=["POST"])
@login_required
def join_group(group_name):
    group_record = group.query.filter_by(name=group_name).first()

    if not group_record:
        return jsonify({"error": "Not a valid group"}), 404

    existing_membership = group_members.query.filter_by(user_id=current_user.id, group_id=group_record.id).first()

    if existing_membership:
        return jsonify({"message": "Already a member of this group"}), 409

    group_user = group_members(user_id=current_user.id, group_id=group_record.id)

    db.session.add(group_user)
    db.session.commit()

    return jsonify({"message": "Successfully joined the group"}), 200

@app.route("/members/<string:group_name>", methods=["GET"])
@login_required
def see_members(group_name):
    cur_group = group.query.filter_by(name=group_name).first()
    if not cur_group:
        return jsonify({"error": "Not a valid group"}), 404

    user_ids = group_members.query.filter_by(group_id = cur_group.id).all()
    result = []
    for u in user_ids:
        cur_user = user.query.filter_by(id=u.user_id).first()
        result.append({
            "username" : cur_user.username
        })
    return jsonify(result), 200 


"""POST ENDPOINTS"""

@app.route("/posts", methods=["POST"])
@login_required
def create_Post():
    data = request.json
    name = data.get("name")
    description = data.get("description")
    time_posted = datetime.now()
    deadline_str = data.get("deadline")

    if not name or not deadline_str:
        return jsonify("Invalid Input"), 400

    DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S"
    try:
        deadline_dt = datetime.strptime(deadline_str, DATETIME_FORMAT)
    except ValueError:
        return jsonify({"message": f"Invalid deadline format. Expected format: {DATETIME_FORMAT}"}), 400

    group_id = group.query.filter_by(name = name).first()
    if not group_id:
        return jsonify("Not a valid group"), 404
    cur_post = post(name=name, description=description, deadline=deadline_dt, creator_id=current_user.id, group_id=group_id.id)
    db.session.add(cur_post)
    db.session.commit()
    return jsonify("Post Created"), 200

@app.route("/posts", methods=["GET"])
@login_required
def my_posts():
    my_groups = group_members.query.filter_by(user_id=current_user.id).all()
    result = []
    for g in my_groups:
        posts = post.query.filter_by(group_id=g.group_id).all()
        for p in posts:
            result.append({
                "name" : p.name,
                "description" : p.description,
                "time_posted" : p.time_posted,
                "deadline" : p.deadline,
                "status" : p.status,
            })
    return jsonify(result), 200

@app.route("/posts/<string:group_name>", methods=["GET"])
@login_required
def group_posts(group_name):
    group_id = group.query.filter_by(name=group_name).first().id
    posts = post.query.filter_by(group_id=group_id).all()
    result = []
    for p in posts:
        result.append({
            "name" : p.name,
            "description" : p.description,
            "time_posted" : p.time_posted,
            "deadline" : p.deadline,
            "status" : p.status,
        }) 
    return jsonify(result), 200      


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    login_manager.init_app(app)
    app.run(debug=True, port=5000)