'use client'

import { useState } from 'react'

export default function Page() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        console.log('submitted')
    }

    return (
        <main>
            <h1 data-test-id="page-title">DataPower — Next.js Example</h1>

            <section data-test-id="login-section">
                <form data-test-id="login-form" onSubmit={handleSubmit}>
                    <input
                        data-test-id="login-email"
                        data-test-class="form-input"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Email"
                    />
                    <input
                        data-test-id="login-password"
                        data-test-class="form-input"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
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
    )
}
