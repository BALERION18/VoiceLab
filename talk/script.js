const GEMINI_API_KEY = "AIzaSyAy6_410MvzJFUFPSTyMamZ1Z26yR4NUtc";
let currentTab = 'pagesection3';
function showNotification(message, type = 'info') {
    const container = document.getElementById('alertscontainer');
    const note = document.createElement('div');
    note.className = `notification ${type}`;
    
    let icon = 'info';
    if(type === 'error') icon = 'fa-circle-exclamation';
    if(type === 'success') icon = 'circle4';

    note.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(note);

    setTimeout(() => {
        note.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => note.remove(), 300);
    }, 4000);
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
    showNotification("Speech Recognition API is not supported in this browser. Please use Chrome or Edge.", "error");
}

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initThemeToggle();
    initTodoModule();
    initSQLModule();
    initTTSModule();
    initFormModule();
});

function initNavigation() {
    const navBtns = document.querySelectorAll('.menubutton');
    const panes = document.querySelectorAll('.sectionpage');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            if(target === currentTab) return;
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            panes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === target) {
                    pane.classList.add('active');
                }
            });

            currentTab = target;
        });
    });
}

function initThemeToggle() {
    const toggleBtn = document.getElementById('mode');
    const htmlEl = document.documentElement;

    toggleBtn.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlEl.setAttribute('data-theme', newTheme);
        
        toggleBtn.innerHTML = newTheme === 'dark' 
            ? '<i class="fa-solid fa-moon"></i>' 
            : '<i class="fa-solid fa-sun"></i>';
    });
}

function initTodoModule() {
    const recordBtn = document.getElementById('task');
    const listEl = document.getElementById('tasks');
    let todos = JSON.parse(localStorage.getItem('voicelab_todos')) || [];
    let isRecording = false;
    const renderTodos = () => {
        listEl.innerHTML = '';
        if(todos.length === 0) {
            listEl.innerHTML = '<li class="empty">No tasks yet. Speak to add one!</li>';
            return;
        }

        todos.forEach((todo, index) => {
            const li = document.createElement('li');
            li.className = `listitem ${todo.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <span>${index + 1}. ${todo.text}</span>
                <div class="taskitem">
                    <button class="icon task1" index="${index}" title="Toggle Complete">
                        <i class="fa-solid ${todo.completed ? 'check' : 'square'}"></i>
                    </button>
                    <button class="icon task2" index="${index}" title="Delete Task">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;
            listEl.appendChild(li);
        });

        document.querySelectorAll('#pagesection3 .task1').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.getAttribute('index');
                todos[idx].completed = !todos[idx].completed;
                saveAndRender();
            });
        });
        document.querySelectorAll('#pagesection3 .task2').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.getAttribute('index');
                todos.splice(idx, 1);
                saveAndRender();
            });
        });
    };

    const saveAndRender = () => {
        localStorage.setItem('voicelab_todos', JSON.stringify(todos));
        renderTodos();
    };

    renderTodos();
    if(!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = function() {
        isRecording = true;
        recordBtn.classList.add('recording');
        recordBtn.querySelector('span').innerText = "Listening...";
    };

    recognition.onspeechend = function() {
        if(isRecording) recognition.stop();
    };

    recognition.onend = function() {
        isRecording = false;
        recordBtn.classList.remove('recording');
        recordBtn.querySelector('span').innerText = "Tap to Speak Task";
    };

    recognition.onresult = function(event) {
        const command = event.results[0][0].transcript.toLowerCase();
        console.log('Todo Command received:', command);

        if (command.startsWith('add') || command.startsWith('create') || command.startsWith('new task')) {
            let taskText = command.replace(/^(add( task)?|create|new task)/, '').trim();
            taskText = taskText.replace(/^(a|an|the|called) /, '').trim();
            
            if(taskText) {
                todos.push({ text: taskText, completed: false });
                saveAndRender();
                showNotification(`Added task: "${taskText}"`, 'success');
            } else {
                showNotification("I didn't catch the task name. Please try again.", 'error');
            }
        } 
        else if (command.startsWith('delete') || command.startsWith('remove')) {
            const numMatch = command.match(/\d+/);
            const wordToNum = { 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5 };
            
            let idxToDelete = -1;
            if(numMatch) {
                idxToDelete = parseInt(numMatch[0]) - 1;
                for(let word in wordToNum) {
                    if(command.includes(word)) {
                        idxToDelete = wordToNum[word] - 1;
                        break;
                    }
                }
            }

            if(idxToDelete >= 0 && idxToDelete < todos.length) {
                const deletedName = todos[idxToDelete].text;
                todos.splice(idxToDelete, 1);
                saveAndRender();
                showNotification(`Deleted task: "${deletedName}"`, 'success');
            } else {
                showNotification("Could not find that task number to delete.", 'error');
            }
        }
        else if (command.includes('clear all') || command.includes('delete all')) {
            todos = [];
            saveAndRender();
            showNotification('All tasks cleared.', 'success');
        }
        else {
            showNotification(`Command "${command}" not recognized. Try "Add [task]" or "Delete [number]".`, 'error');
        }
    };

    recognition.onerror = function(event) {
        isRecording = false;
        recordBtn.classList.remove('recording');
        recordBtn.querySelector('span').innerText = "Tap to Speak Task";
        showNotification(`Error occurred in recognition: ${event.error}`, 'error');
    };

    recordBtn.addEventListener('click', () => {
        if(isRecording) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch(e) {
                console.error(e);
            }
        }
    });
}

function initSQLModule() {
    const recordBtn = document.getElementById('sql');
    const promptArea = document.getElementById('description');
    const generateBtn = document.getElementById('code');
    const outputArea = document.getElementById('sqltext1');
    const copyBtn = document.getElementById('sqltext');
    const loader = document.getElementById('sql1');
    
    let isRecording = false;
    if(SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'US';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = function() {
            isRecording = true;
            recordBtn.classList.add('recording');
            recordBtn.querySelector('span').innerText = "Listening...";
        };

        recognition.onspeechend = function() {
            if(isRecording) recognition.stop();
        };

        recognition.onend = function() {
            isRecording = false;
            recordBtn.classList.remove('recording');
            recordBtn.querySelector('span').innerText = "Dictate Requirements";
        };

        recognition.onresult = function(event) {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            
            if(finalTranscript) {
                const currentVal = promptArea.value;
                promptArea.value = currentVal + (currentVal.endsWith(' ') || currentVal === '' ? '' : ' ') + finalTranscript;
            }
        };

        recognition.onerror = function(event) {
            isRecording = false;
            recordBtn.classList.remove('recording');
            recordBtn.querySelector('span').innerText = "Dictate Requirements";
            showNotification(`Recognition error: ${event.error}`, 'error');
        };

        recordBtn.addEventListener('click', () => {
            if(isRecording) {
                recognition.stop();
            } else {
                try {
                    recognition.start();
                } catch(e) {
                    console.error(e);
                }
            }
        });
    } else {
        recordBtn.style.display = 'none';
    }

    generateBtn.addEventListener('click', async () => {
        const query = promptArea.value.trim();
        if(!query) {
            showNotification("Please dictate or type a query description first.", 'warning');
            return;
        }

        outputArea.innerText = '';
        loader.classList.remove('hidden');
        generateBtn.disabled = true;
        generateBtn.style.opacity = '0.7';

        try {
            const systemInstruction = "You are an expert SQL Generator. User will provide a natural language description of data they want. Produce ONLY valid SQL code. Do not include markdown formatting like ```sql or explanations. Just the raw SQL text so it can be copied directly.";
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    system_instruction: {
                        parts: { text: systemInstruction }
                    },
                    contents: [{
                        parts: [{ text: query }]
                    }],
                    generationConfig: {
                        temperature: 0.1
                    }
                })
            });

            if(!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const generatedText = data.candidates[0].content.parts[0].text;
            
            let cleanSQL = generatedText.replace(/```sql/ig, '').replace(/```/g, '').trim();
            
            outputArea.innerText = cleanSQL;
            showNotification("SQL generated successfully!", 'success');
            
        } catch (error) {
            console.error('Gemini API Error:', error);
            outputArea.innerText = '-- Failed to generate SQL. Please check your API key and connection.';
            showNotification("Failed to generate SQL.", 'error');
        } finally {
            loader.classList.add('hidden');
            generateBtn.disabled = false;
            generateBtn.style.opacity = '1';
        }
    });

    copyBtn.addEventListener('click', () => {
        const textToCopy = outputArea.innerText;
        if(textToCopy && !textToCopy.includes('appear here')) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                showNotification("Copied to clipboard!", 'success');
                copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
                }, 2000);
            }).catch(err => {
                showNotification("Failed to copy.", 'error');
            });
        }
    });
}

function initTTSModule() {
    const textInput = document.getElementById('speak');
    const voiceSelect = document.getElementById('voice');
    const rateSlider = document.getElementById('speed');
    const pitchSlider = document.getElementById('pitch');
    const rateValue = document.getElementById('number');
    const pitchValue = document.getElementById('number1');
    
    const playBtn = document.getElementById('audio1');
    const pauseBtn = document.getElementById('audio');
    const stopBtn = document.getElementById('audio2');

    const synth = window.speechSynthesis;
    let voices = [];

    const populateVoices = () => {
        voices = synth.getVoices();
        voiceSelect.innerHTML = '';
        
        let filteredVoices = voices.filter(v => v.lang.startsWith('en'));
        if (filteredVoices.length === 0) filteredVoices = voices;
        filteredVoices = filteredVoices.slice(0, 3);

        filteredVoices.forEach((voice, i) => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.setAttribute('lang', voice.lang);
            option.setAttribute('name1', voice.name);
            voiceSelect.appendChild(option);
        });
    };

    populateVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoices;
    }

    rateSlider.addEventListener('input', () => { rateValue.innerText = rateSlider.value; });
    pitchSlider.addEventListener('input', () => { pitchValue.innerText = pitchSlider.value; });

    const speak = () => {
        if (textInput.value !== '') {
            synth.cancel();
            
            setTimeout(() => {
                const utterThis = new SpeechSynthesisUtterance(textInput.value);
                
                utterThis.onend = function (event) {
                    console.log('SpeechSynthesisUtterance.onend');
                };
                
                utterThis.onerror = function (event) {
                    console.error('SpeechSynthesisUtterance.onerror');
                };
                
                const selectedOption = voiceSelect.selectedOptions[0]?.getAttribute('name1');
                if (selectedOption) {
                    for (let i = 0; i < voices.length; i++) {
                        if (voices[i].name === selectedOption) {
                            utterThis.voice = voices[i];
                            break;
                        }
                    }
                }
                
                utterThis.pitch = pitchSlider.value;
                utterThis.rate = rateSlider.value;
                synth.speak(utterThis);
            }, 50);
        } else {
            showNotification("Please enter some text to speak.", "warning");
        }
    };

    playBtn.addEventListener('click', () => {
        if(synth.paused) {
            synth.resume();
        } else {
            speak();
        }
    });

    pauseBtn.addEventListener('click', () => {
        if(synth.speaking && !synth.paused) {
            synth.pause();
            showNotification("Speech paused", "info");
        }
    });

    stopBtn.addEventListener('click', () => {
        if(synth.speaking) {
            synth.cancel();
            showNotification("Speech stopped", "info");
        }
    });
}

function initFormModule() {
    const recordBtn = document.getElementById('form1');
    const clearBtn = document.getElementById('form2');
    const downloadBtn = document.getElementById('file');
    const canvas = document.getElementById('form6');
    let isRecording = false;

    const removeEmptyState = () => {
        const emptyEl = canvas.querySelector('.empty');
        if(emptyEl) emptyEl.remove();
    };

    const handleFormCommand = (command) => {
        let matched = false;
        
        if(command.includes('button')) {
            removeEmptyState();
            let btnText = command.replace(/.*button\s+(?:called\s+)?/i, '').trim() || 'Submit';
            btnText = btnText.charAt(0).toUpperCase() + btnText.slice(1);

            const field = document.createElement('div');
            field.className = 'form3';
            field.innerHTML = `
                <button type="submit" class="actionbutton">${btnText}</button>
            `;
            canvas.appendChild(field);
            matched = true;
            showNotification(`Added button: ${btnText}`, 'success');
        }
        else if(command.startsWith('add ')) {
            removeEmptyState();
            let labelText = command.replace(/^add\s+/i, '').trim();
            labelText = labelText.replace(/\s+(field|input)$/i, '').trim();
            
            let inputType = 'text';
            let inputProps = '';

            const lowerLabel = labelText.toLowerCase();

            if(lowerLabel.includes('email')) {
                inputType = 'email';
                inputProps = 'required pattern="[a-z0-9._%+\\-]+@[a-z0-9.\\-]+\\.[a-z]{2,}$" title="Please enter a valid email address (e.g. user@domain.com)"';
                if(lowerLabel === 'email') labelText = 'Email';
            } 
            else if(lowerLabel.includes('contact') || lowerLabel.includes('phone') || lowerLabel.includes('number') || lowerLabel.includes('mobile')) {
                inputType = 'tel';
                inputProps = 'required pattern="[0-9]{10,15}" title="Please enter a valid contact number (10-15 digits)"';
                if(lowerLabel === 'contact' || lowerLabel === 'phone' || lowerLabel === 'mobile') labelText = 'Contact Number';
            }

            labelText = labelText.replace(/\b\w/g, l => l.toUpperCase());

            const field = document.createElement('div');
            field.className = 'form3';
            field.innerHTML = `
                <label>${labelText}</label>
                <input type="${inputType}" placeholder="Enter ${labelText}" ${inputProps}>
            `;
            canvas.appendChild(field);
            matched = true;
            showNotification(`Added ${inputType} input: ${labelText}`, 'success');
        }

        if(!matched) {
            showNotification(`Command "${command}" didn't match known format. Try "Add Name" or "Add Email".`, 'warning');
        }
    };

    if(SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = function() {
            isRecording = true;
            recordBtn.classList.add('recording');
            recordBtn.querySelector('span').innerText = "Listening for Form Elements...";
        };

        recognition.onspeechend = function() {
            if(isRecording) recognition.stop();
        };

        recognition.onend = function() {
            isRecording = false;
            recordBtn.classList.remove('recording');
            recordBtn.querySelector('span').innerText = "Listen for Elements";
        };

        recognition.onresult = function(event) {
            const command = event.results[0][0].transcript.toLowerCase();
            console.log("Form builder command:", command);
            handleFormCommand(command);
        };

        recognition.onerror = function(event) {
            isRecording = false;
            recordBtn.classList.remove('recording');
            recordBtn.querySelector('span').innerText = "Listen for Elements";
            showNotification(`Recognition error: ${event.error}`, 'error');
        };

        recordBtn.addEventListener('click', () => {
            if(isRecording) {
                recognition.stop();
            } else {
                try {
                    recognition.start();
                } catch(e) {
                    console.error(e);
                }
            }
        });
    } else {
        recordBtn.style.display = 'none';
    }

    clearBtn.addEventListener('click', () => {
        canvas.innerHTML = '<div class="empty">Your form preview will appear here. Start dictating fields!</div>';
        showNotification("Canvas cleared", "info");
    });

    downloadBtn.addEventListener('click', () => {
        if(canvas.querySelector('.empty')) {
            showNotification("The form is empty. Please add elements first.", "warning");
            return;
        }

        let formHTML = canvas.innerHTML.replace(/<div class="empty".*?<\/div>/g, '');
        
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voice Generated Form</title>
    <style>
        body { font-family: system-ui, sans-serif; padding: 40px; background: whitesmoke; }
        .formcontainer { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .form3 { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
        label { font-weight: 500; color: #333; }
        input { padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; }
        .actionbutton { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 16px; margin-top: 10px; }
        .actionbutton:hover { background: #2563eb; }
    </style>
</head>
<body>
    <div class="formcontainer">
        <h2>Generated Form</h2>
        <form onsubmit="event.preventDefault(); alert('Form submitted!');">
            ${formHTML}
        </form>
    </div>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'voice-generated-form.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification("Form downloaded successfully!", "success");
    });
}
