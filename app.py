from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

DATA_FILE = Path("courses.json")

VALID_STATUSES = {"未开始", "进行中", "已完成"}
REQUIRED_FIELDS = {"name", "description", "target_date", "status"}


def load_courses():
    """从 JSON 文件加载课程数据。"""
    if not DATA_FILE.exists():
        return []

    try:
        with DATA_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)

        if not isinstance(data, list):
            return []

        return data

    except json.JSONDecodeError:
        return []


def save_courses(courses):
    """将课程数据保存到 JSON 文件。"""
    with DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(courses, file, ensure_ascii=False, indent=2)


def find_course(courses, course_id):
    """根据 ID 查找课程。"""
    return next(
        (course for course in courses if course["id"] == course_id),
        None
    )


def validate_course_data(data, partial=False):
    """
    验证课程数据。
    partial=True 时用于 PATCH，只验证提交的字段。
    """
    if not isinstance(data, dict):
        return "请求内容必须是 JSON 对象"

    if not partial:
        missing_fields = REQUIRED_FIELDS - data.keys()
        if missing_fields:
            return f"缺少字段：{', '.join(missing_fields)}"

    if "name" in data:
        if not isinstance(data["name"], str) or not data["name"].strip():
            return "name 必须是非空字符串"

    if "description" in data:
        if not isinstance(data["description"], str):
            return "description 必须是字符串"

    if "target_date" in data:
        try:
            datetime.strptime(data["target_date"], "%Y-%m-%d")
        except (TypeError, ValueError):
            return "target_date 必须使用 YYYY-MM-DD 格式"

    if "status" in data:
        if data["status"] not in VALID_STATUSES:
            return "status 必须是：未开始、进行中或已完成"

    return None


@app.get("/")
def home():
    return jsonify({
        "message": "欢迎使用 CodeCraftHub API",
        "endpoints": [
            "GET /api/courses",
            "POST /api/courses",
            "GET /api/courses/<id>",
            "PUT /api/courses/<id>",
            "PATCH /api/courses/<id>",
            "DELETE /api/courses/<id>"
        ]
    })


@app.get("/api/courses")
def get_courses():
    """获取全部课程。"""
    courses = load_courses()

    # 可选筛选，例如：
    # /api/courses?status=进行中
    status = request.args.get("status")

    if status:
        if status not in VALID_STATUSES:
            return jsonify({
                "error": "无效的状态",
                "valid_statuses": list(VALID_STATUSES)
            }), 400

        courses = [
            course for course in courses
            if course.get("status") == status
        ]

    return jsonify(courses), 200


@app.post("/api/courses")
def create_course():
    """创建课程。"""
    data = request.get_json(silent=True)

    error = validate_course_data(data)
    if error:
        return jsonify({"error": error}), 400

    courses = load_courses()

    new_id = max(
        [course.get("id", 0) for course in courses],
        default=0
    ) + 1

    new_course = {
        "id": new_id,
        "name": data["name"].strip(),
        "description": data["description"],
        "target_date": data["target_date"],
        "status": data["status"]
    }

    courses.append(new_course)
    save_courses(courses)

    return jsonify(new_course), 201


@app.get("/api/courses/<int:course_id>")
def get_course(course_id):
    """获取单个课程。"""
    courses = load_courses()
    course = find_course(courses, course_id)

    if course is None:
        return jsonify({"error": "课程不存在"}), 404

    return jsonify(course), 200


@app.put("/api/courses/<int:course_id>")
def replace_course(course_id):
    """完整替换一个课程。"""
    data = request.get_json(silent=True)

    error = validate_course_data(data)
    if error:
        return jsonify({"error": error}), 400

    courses = load_courses()
    course = find_course(courses, course_id)

    if course is None:
        return jsonify({"error": "课程不存在"}), 404

    course.update({
        "name": data["name"].strip(),
        "description": data["description"],
        "target_date": data["target_date"],
        "status": data["status"]
    })

    save_courses(courses)

    return jsonify(course), 200


@app.patch("/api/courses/<int:course_id>")
def update_course(course_id):
    """部分更新课程。"""
    data = request.get_json(silent=True)

    error = validate_course_data(data, partial=True)
    if error:
        return jsonify({"error": error}), 400

    courses = load_courses()
    course = find_course(courses, course_id)

    if course is None:
        return jsonify({"error": "课程不存在"}), 404

    allowed_fields = {
        "name",
        "description",
        "target_date",
        "status"
    }

    for field, value in data.items():
        if field in allowed_fields:
            if field == "name":
                value = value.strip()
            course[field] = value

    save_courses(courses)

    return jsonify(course), 200

@app.delete("/api/courses/<int:course_id>")
def delete_course(course_id):
    """删除课程。"""
    courses = load_courses()
    course = find_course(courses, course_id)

    if course is None:
        return jsonify({"error": "课程不存在"}), 404

    courses.remove(course)
    save_courses(courses)

    return jsonify({
        "message": "课程已删除",
        "course": course
    }), 200


if __name__ == "__main__":
    app.run(debug=True)