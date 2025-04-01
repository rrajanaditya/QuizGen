import axios from 'axios';

export const getQuizFromNotes = async (notes) => {
    var bodyFormData = new FormData();
    bodyFormData.append('notes', notes);
    const response = await axios.post("http://127.0.0.1:5000/generatefromnotes", bodyFormData);
    return [response.status, response.data]
}

export const getQuizFromFile = async (file) => {
    var bodyFormData = new FormData();
    bodyFormData.append('file', file);
    const response = await axios.post("http://127.0.0.1:5000/generatefromfile", bodyFormData);
    return [response.status, response.data]
}