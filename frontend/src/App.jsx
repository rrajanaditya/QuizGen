import React, { useState } from "react";
import styled from "styled-components";
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { ThreeDots } from 'react-loading-icons'

import {
  Container,
  TextField,
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Grid,
  Alert,
  Stack,
  Button
} from "@mui/material";
import { getQuizFromFile, getQuizFromNotes } from "./api/generateQuiz";

// See https://github.com/mui/material-ui/issues/24681
const CharacterCount = ({ count, helperText, max }) => (
  <Stack style={{ backgroundColor: '#F8F9FA' }} direction="row" justifyContent={helperText ? 'space-between' : 'flex-end'} whiteSpace="nowrap">
    <Box overflow="hidden" textOverflow="ellipsis">
      {helperText}
    </Box>
    <Box color={count >= max ? 'error.main' : undefined}>
      {count} / {max}
    </Box>
  </Stack>
);
const StyledContainer = styled(Container)`
  max-width: 100% !important;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-radius: 10px;
`;

const GenerateOptionCard = styled(Box)`
  height: fit-content;
  width: 200px;
  padding: 16px;
  background-color: #FFFFFF;
  border: 1px solid #CED4DA;
  border-radius: 16px !important;
  -webkit-box-shadow: 0px 0px 4px -4px rgba(46,74,117,1);
  -moz-box-shadow: 0px 0px 4px -4px rgba(46,74,117,1);
  box-shadow: 0px 0px 4px -4px rgba(46,74,117,1);
  margin: 16px 0px;
  @media (max-width: 600px) {
      margin: 0px;
  }
  &:hover {
    cursor: pointer;
  }
`;

const GenerateButton = styled(Button)`
  background-color: #007BFF;
  width: 300px;
  height: 36px;
  text-align: center;
  padding: 16px;
  border-radius: 8px;
  color:rgb(232, 231, 231);
  font-weight: bold;
  &:hover {
    background-color: #0056B3;
    cursor: pointer;
  }
`

const Heading = styled(Typography)`
  color: #343A40 !important;
  font-size: 16px !important;
  font-weight: 500 !important;
`
const BodyText = styled(Typography)`
  color: #495057 !important;
  font-size: 14px !important;
`

const StyledCard = styled(Card)`
  width: 100%;
  margin-top: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
`;

const NotesInput = styled(TextField)`
  margin: 16px 0px !important;
`

const App = () => {
  const maxNotesLength = 10000
  const [notes, setNotes] = useState("");
  const [generateMethod, setGenerateMethod] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [file, setFile] = useState(null);
  const [generating, setGenerating] = useState(false);

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };
  const generateQuiz = async () => {
    setGenerating(true);
    if (generateMethod == null) {
      alert("Please select a method to generate and add content.")
      setGenerating(false);
      return;
    }
    var responseStatus;
    var responseData;
    try {
      if (generateMethod == 0) {
        if (notes.trim() == "") {
          alert("Please add some notes before generating.")
          setGenerating(false);
          return;
        }
        [responseStatus, responseData] = await getQuizFromNotes(notes);
      } else {
        if (!file) {
          alert("Please select a file before generating.")
          setGenerating(false);
          return;
        }
        [responseStatus, responseData] = await getQuizFromFile(file);
      }

      if (responseStatus !== 200) {
        alert("Error generating from notes. Try again later!")
        setGenerating(false);
        return;
      }
      const newQuestions = responseData.map(item => {
        return { ...item, selectedAnswer: null }
      })
      setQuestions(newQuestions);
      setGenerating(false);
      return;
    } catch (err) {
      alert("Error generating content. Check console for information.")
      console.error(err)
    } finally {
      setGenerating(false);
    }

  }

  const changeSelectedAnswer = (questionID, selectedAnswer) => {
    const newQuestions = questions.map(item => {
      if (item.id == questionID)
        item.selectedAnswer = selectedAnswer
      return item
    })
    setQuestions(newQuestions)
  }
  return (
    <StyledContainer maxWidth="sm">
      <Typography variant="h4" gutterBottom textAlign={"center"}>
        QuizGen
      </Typography>
      <Grid container width={"fit-content"} spacing={{ xs: 1, sm: 2 }} marginBottom={"16px"}>
        <Grid size={{ xs: 12, sm: 6 }} display={"flex"} justifyContent={"center"}>
          <GenerateOptionCard
            fullWidth
            onClick={() => { setGenerateMethod(0) }}
          >
            <Box display={"flex"} alignItems={"center"}>
              <NoteAltOutlinedIcon fontSize="large" />
              <Heading lineHeight={"1.2em"} marginLeft={"4px"} >Generate from notes</Heading>
            </Box>
            <BodyText
              lineHeight={"1.2em"} marginTop={"12px"} marginLeft={"6px"}>
              Enter notes to generate quiz questions
            </BodyText>
          </GenerateOptionCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }} display={"flex"} justifyContent={"center"}>
          <GenerateOptionCard
            fullWidth
            onClick={() => { setGenerateMethod(1) }}
          >
            <Box display={"flex"} alignItems={"center"}>
              <UploadFileOutlinedIcon fontSize="large" />
              <Heading lineHeight={"1.2em"} marginLeft={"4px"} >Generate from file</Heading>
            </Box>
            <BodyText
              lineHeight={"1.2em"} marginTop={"12px"} marginLeft={"6px"}>
              Upload a .txt or a .pdf file to generate questions
            </BodyText>
          </GenerateOptionCard>
        </Grid>
      </Grid>
      {
        generateMethod != null &&
        (generateMethod == 0 ?
          <NotesInput
            fullWidth
            multiline
            rows={4}
            helperText={<CharacterCount count={notes.length} max={maxNotesLength} />}
            inputProps={{ maxLength: 10000 }}
            label="Enter notes"
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ "borderRadius": "16px" }}
          />
          :
          <input
            type="file"
            accept=".txt,.pdf"
            onChange={handleFileUpload}
            style={{ margin: "16px 0px" }}
          />)
      }
      <GenerateButton
        variant="contained"
        onClick={generateQuiz}
        disabled={generating}
      >
        {generating ? <ThreeDots style={{ height: '12px' }} /> : "Generate Quiz"}
      </GenerateButton>
      {questions.length > 0 && (
        <StyledCard>
          <CardContent>
            <Typography variant="h5">Generated Questions</Typography>
            <List>
              {questions.map((q) => (
                <ListItem key={q.id} style={{ flexDirection: "column", alignItems: "flex-start" }}>
                  <Typography variant="body1" gutterBottom style={{ color: '#343A40' }}>
                    {q.question}
                  </Typography>
                  {q.selectedAnswer != null && (
                    q.selectedAnswer == q.correctAnswerIndex ?
                      <Alert severity="success">Correct</Alert> :
                      <Alert severity="error">Incorrect. Try Again.</Alert>
                  )
                  }
                  <FormControl component="fieldset" sx={{ color: '#595b5d !important' }}>
                    <RadioGroup>
                      {q.answers.map((option, i) => (
                        <FormControlLabel
                          key={i}
                          value={option}
                          control={<Radio />}
                          label={option}
                          onClick={() => { changeSelectedAnswer(q.id, i) }}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </StyledCard>
      )}
    </StyledContainer>
  );
};

export default App;
