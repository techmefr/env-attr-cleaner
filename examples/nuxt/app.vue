<template>
    <main>
        <h1 data-test-id="page-title">DataPower — Nuxt Example</h1>

        <section data-test-id="login-section">
            <form data-test-id="login-form" @submit.prevent="handleSubmit">
                <input
                    data-test-id="login-email"
                    data-test-class="form-input"
                    type="email"
                    v-model="email"
                    placeholder="Email"
                />
                <input
                    data-test-id="login-password"
                    data-test-class="form-input"
                    type="password"
                    v-model="password"
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
</template>

<script setup lang="ts">
const email = ref('')
const password = ref('')

function handleSubmit(): void {
    console.log('submitted')
}
</script>
