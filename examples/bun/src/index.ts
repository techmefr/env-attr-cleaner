function renderLogin(): string {
    return `
        <main>
            <h1 data-test-id="page-title">env-attr-cleaner — Bun Example</h1>
            <section data-test-id="login-section">
                <form data-test-id="login-form">
                    <input data-test-id="login-email" data-test-class="form-input" type="email" placeholder="Email" />
                    <input data-test-id="login-password" data-test-class="form-input" type="password" placeholder="Password" />
                    <button data-test-id="login-submit" data-test-class="form-button" type="submit">Login</button>
                </form>
            </section>
        </main>
    `
}

const server = Bun.serve({
    port: 3000,
    fetch() {
        return new Response(renderLogin(), {
            headers: { 'Content-Type': 'text/html' },
        })
    },
})

console.log(`Listening on http://localhost:${server.port}`)
