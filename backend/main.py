from dotenv import dotenv_values
from google import genai
from pypdf import PdfReader
from PIL import Image
import io
import pytesseract
import re
from pydantic import BaseModel
import pathlib
import json
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
from flask_cors import CORS, cross_origin

class ContentExtractor:
    def __init__(self, file_name= None):
        self.file_name = file_name
    def clean_text(self, text: str) -> str:
        text = re.sub(r"[^ a-zA-Z0-9]+",' ', text.strip())
        text = re.sub(r'\s+', ' ', text)
        return text
    def get_image_texts(self, image_list: list) -> str:
        image_texts = set()
        for image in image_list:
            # pil_image = Image.open(io.BytesIO(image.data))
            image_text = pytesseract.image_to_string(image.image, lang='eng')
            image_text = self.clean_text(image_text)
            image_texts.add(image_text)
        return "\n".join(list(image_texts))
    def extract_data_from_image(self):
        all_images = []
        reader = PdfReader(self.file_name)
        for page in reader.pages:
            all_images += [image for image in page.images if image not in all_images]
        image_texts = self.get_image_texts(all_images)
        return image_texts
    def extract_data_from_slides(self):
        all_text = []
        reader = PdfReader(self.file_name)
        for page in reader.pages:
            page_text = page.extract_text()
            page_text = self.clean_text(page_text)
            all_text.append(page_text)
        page_texts = "\n".join(all_text)
        return page_texts
    def get_model_query_text(self, text: str):
        model_query = "NOTES : \n\n" + self.clean_text(text) + "\n\n"
        model_query += "Use the above data to give me few revision quiz questions along with multi choice answers"
        return model_query
    def get_model_query_pdf(self):
        image_texts = self.extract_data_from_image()
        page_texts = self.extract_data_from_slides()
        model_query = "SLIDE-IMAGE-TEXT :\n\n" + image_texts + "\n\nSLIDE-TEXTS : \n\n" + page_texts + "\n\n"
        model_query += "Use the above data to give me few revision quiz questions along with multi choice answers"
        return model_query
class QuizQuestion(BaseModel):
    id: int
    question: str
    answers: list[str]
    correctAnswerIndex: int
class GeminiQuizModel:
    def __init__(self):
        config = dotenv_values(".env")
        self.client = genai.Client(api_key=config['GEMINI_API_KEY'])
        self.model = config['MODEL_NAME']
    def get_quiz_data(self, model_query: str):
        response = self.client.models.generate_content(
            model=self.model,
            contents=model_query,
            config={
                'response_mime_type': 'application/json',
                'response_schema': list[QuizQuestion],
            },
        )
        return json.loads(response.text)
    
UPLOAD_FOLDER = 'assets/'
ALLOWED_EXTENSIONS = {'txt', 'pdf'}
app = Flask(__name__)
cors = CORS(app)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['CORS_HEADERS'] = 'Content-Type'


if not os.path.exists(UPLOAD_FOLDER):
    os.mkdir(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/generatefromnotes', methods=['POST'])
@cross_origin()
def generateQuizFromNotes():
    if 'notes' not in request.form:
        return jsonify({ 'error': 'Note text required for processing.' }), 400
    model_query = ContentExtractor().get_model_query_text(request.form['notes'])
    quiz_data = GeminiQuizModel().get_quiz_data(model_query)
    return jsonify(quiz_data), 200

@app.route('/generatefromfile', methods=['POST'])
@cross_origin()
def generateQuizFromFile():
    if 'file' not in request.files:
        return jsonify({ 'error': 'File required for processing.' }), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({ 'error': 'File required for processing.' }), 400
    if not allowed_file(file.filename):
        return jsonify({ 'error': 'File type not allowed.' }), 400
    filename = secure_filename(file.filename)
    filePath = pathlib.Path(app.config['UPLOAD_FOLDER']) / filename
    file.save(filePath)
    model_query = ContentExtractor(filePath).get_model_query_pdf()
    quiz_data = GeminiQuizModel().get_quiz_data(model_query)
    os.remove(filePath)
    return jsonify(quiz_data), 200
if __name__ == "__main__":
    app.run(port=5000)