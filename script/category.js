const formActionHtml = `
        <div class="card">
            <div class="card-body">
                <div class="alert alert-info mb-"></div>
                <h4 class="card-title font-weight-bold">
                    Insert Sheet name & id
                </h4>
                <div class="input-group input-group-sm align-items-center">
                    <input class="dcd-default-form form-control form-url" placeholder="e.g 123v-abc_rT98!Kuis Modifikasi Aplikasi Perangkat Lunak" aria-label="Tambah Kategori Baru" aria-describedby="button-addon2" name="category" id="exam-category-name" value="">
                    <div class="input-group-append">
                        <button class="dcd-btn dcd-btn-primary ml-auto btn-execute" title="Mulai" data-toggle="tooltip">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gear-fill" viewBox="0 0 16 16">
                                <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
`

const clear = () => new Promise((resolve, reject) => {
    chrome.storage.local.clear(function (result) {
        console.log('Clear storage value');
        resolve('Clear All storage')
    });
})

const save = (result) => new Promise((resolve, reject) => {
    chrome.storage.local.set({ current: result.category, questions: result.questions }, function () {
        resolve('Saving data to local')
    });
})

const load = () => new Promise((resolve, reject) => {
    chrome.storage.local.get(['count', 'isReload'], function (result) {
        resolve({count: result.count, isReload: result.isReload})
    });
})

window.onload = async () => {

    const formAction = document.createElement('div')
    formAction.className = 'col-md-12 grid-margin stretch-card'
    formAction.innerHTML = formActionHtml

    const card = document.querySelectorAll('.row')[3]
    card.prepend(formAction)

    const state = await load()
    if (state.isReload){
        document.querySelector('.alert').innerText = `Berhasil menambahkan ${state.count} quiz pada proses sebelumnya`
    }

    document.querySelector('.btn-execute').addEventListener('click', async () => {
        const form = document.querySelector('.form-url').value.split('!')
        fetch(`https://sheet-mirror.vercel.app/api/sheet?id=${form[0]}&name=${form[1]}`)
            .then(res => res.json())
            .then(async (result) => {
                await clear()
                await save(result)

                const url = document.querySelector('.form-url').value
                const createUrl = document.querySelector('a[href*=create]').href
                const payload = { url, createUrl, type: 'request-execute-start' }
                chrome.extension.sendMessage(payload, function (response) {
                    console.log(response);
                });
            })
    })
}