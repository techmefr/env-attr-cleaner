<script lang="ts">
let email = $state('')
let password = $state('')

function handleSubmit(e: SubmitEvent): void {
    e.preventDefault()
    console.log('submitted')
}
</script>

<main>
    <h1 data-test-id="page-title">DataPower — Svelte Example</h1>

    <section data-test-id="login-section">
        <form data-test-id="login-form" onsubmit={handleSubmit}>
            <input
                data-test-id="login-email"
                data-test-class="form-input"
                type="email"
                bind:value={email}
                placeholder="Email"
            />
            <input
                data-test-id="login-password"
                data-test-class="form-input"
                type="password"
                bind:value={password}
                placeholder="Password"
            />
            <button
                data-test-id="login-submit"
                data-test-class="form-button"
                type="submit"
            >
                Login
            </button>
        </form>
    </section>
</main>
