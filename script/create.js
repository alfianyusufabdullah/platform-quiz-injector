class Cursor {
    static getCurrentCursorPosition(parentElement) {
        var selection = window.getSelection(),
            charCount = -1,
            node;

        if (selection.focusNode) {
            if (Cursor._isChildOf(selection.focusNode, parentElement)) {
                node = selection.focusNode;
                charCount = selection.focusOffset;

                while (node) {
                    if (node === parentElement) {
                        break;
                    }

                    if (node.previousSibling) {
                        node = node.previousSibling;
                        charCount += node.textContent.length;
                    } else {
                        node = node.parentNode;
                        if (node === null) {
                            break;
                        }
                    }
                }
            }
        }

        return charCount;
    }

    static setCurrentCursorPosition(chars, element) {
        if (chars >= 0) {
            var selection = window.getSelection();

            let range = Cursor._createRange(element, { count: chars });

            if (range) {
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    static _createRange(node, chars, range) {
        if (!range) {
            range = document.createRange()
            range.selectNode(node);
            range.setStart(node, 0);
        }

        if (chars.count === 0) {
            range.setEnd(node, chars.count);
        } else if (node && chars.count > 0) {
            if (node.nodeType === Node.TEXT_NODE) {
                if (node.textContent.length < chars.count) {
                    chars.count -= node.textContent.length;
                } else {
                    range.setEnd(node, chars.count);
                    chars.count = 0;
                }
            } else {
                for (var lp = 0; lp < node.childNodes.length; lp++) {
                    range = Cursor._createRange(node.childNodes[lp], chars, range);

                    if (chars.count === 0) {
                        break;
                    }
                }
            }
        }

        return range;
    }

    static _isChildOf(node, parentElement) {
        while (node !== null) {
            if (node === parentElement) {
                return true;
            }
            node = node.parentNode;
        }

        return false;
    }
}

let currentQuestion = []

const loadQuestions = new Promise((resolve, reject) => {
    chrome.storage.local.get(['questions'], function (result) {
        resolve(result.questions)
    });
})

const save = questions => new Promise((resolve, reject) => {
    chrome.storage.local.set({ questions }, function () {
        resolve('Request execute')
    });
})

const getStorageData = new Promise((resolve, reject) => {
    chrome.storage.local.get(['quiz'], function (result) {
        resolve(result.quiz)
    });
})

const simulateFocusWithCursor = (form) => {
    const offset = Cursor.getCurrentCursorPosition(form)
    Cursor.setCurrentCursorPosition(offset + 1, form)
    form.focus()
}

const measureAllFormActive = (forms) => {
    forms.forEach(form => simulateFocusWithCursor(form))
}

window.onload = async () => {
    document.querySelector('.js-save-question').addEventListener('click', () => {
        const payload = { type: 'save-clicked', action: currentQuestion.length > 0 ? 'open-tab' : 'reload' }
        chrome.extension.sendMessage(payload, function (response) {
            console.log(response);
        });
    })

    currentQuestion = await loadQuestions
    const quiz = currentQuestion.shift()

    const payload = { type: 'current-data-procced', quiz }
    chrome.extension.sendMessage(payload, function (response) {
        console.log(response);
    });

    await save(currentQuestion)

    const multipleChoices = quiz.multiple_choices
    const answerWithQuestionLength = multipleChoices.length + 1

    const currentFormAction = document.querySelectorAll('.fr-element')
    const currentFormActionLength = currentFormAction.length

    const differensLenght = answerWithQuestionLength - currentFormActionLength
    if (differensLenght > 0) {
        for (let index = 0; index < differensLenght; index++) {
            document.querySelector('.js-add-new-choice').click()
        }
    }

    setTimeout(() => {
        document.querySelectorAll('form > input').forEach((input, index) => {
            if (index === 0) {
                return
            } else {
                switch (input.name) {
                    case 'question':
                        input.value = quiz.question
                        break
                    case 'multiple_choices':
                        input.value = new Set(...multipleChoices)
                        break
                    case 'correct_choice_position':
                        input.value = quiz.correct_choice_position
                        break
                    case 'is_choices_randomized':
                        input.value = quiz.is_choices_randomized
                        break
                }
            }
        })

        const exectFormAction = document.querySelectorAll('.fr-element')
        exectFormAction.forEach((form, index) => {
            if (index === 0) {
                form.innerText = quiz.question
                document.querySelector('#preview').innerText = quiz.question
            } else {
                const choise = multipleChoices[index - 1]
                form.innerText = choise

                if (choise === quiz.correct_choice_text){
                    document.querySelectorAll('.checkmark')[index - 1].click()
                }
            }

            simulateFocusWithCursor(form)
        })

        measureAllFormActive(exectFormAction)

        if (Boolean(quiz.is_choices_randomized)) {
            document.querySelectorAll('.btn.btn-secondary')[1].click()
        }

        document.querySelector('.js-save-question').click()
    }, 1000);
}