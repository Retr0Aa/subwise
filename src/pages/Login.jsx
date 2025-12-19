import React, { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, fetchSignInMethodsForEmail } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button } from "react-bootstrap";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please enter both email and password.");
            return;
        }

        try {
            const methods = await fetchSignInMethodsForEmail(auth, email);
            if (methods.includes("google.com")) {
                setError("This email is registered with Google. Use Google login.");
                return;
            }
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/");
        } catch (err) {
            setError("Incorrect email or password.");
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        try {
            await signInWithPopup(auth, googleProvider);
            navigate("/");
        } catch (err) {
            setError("Google login failed. Try again.");
        }
    };

    return (
        <Container
            className="d-flex justify-content-center align-items-center flex-column"
            style={{ height: "80vh" }}
        >
            <h1 className="mb-4">Login</h1>

            <Form onSubmit={handleEmailLogin} className="d-flex flex-column align-items-center w-100" style={{ maxWidth: "400px" }}>
                <Form.Group className="mb-3 w-100">
                    <Form.Control
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        isInvalid={!!error && !email}
                    />
                </Form.Group>

                <Form.Group className="mb-3 w-100">
                    <Form.Control
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        isInvalid={!!error && !password}
                    />
                </Form.Group>

                <Button type="submit" variant="primary" className="w-100 mb-2">
                    Login
                </Button>
            </Form>

            <Button
                size="lg"
                variant="secondary"
                onClick={handleGoogleLogin}
                className="w-100 d-flex align-items-center justify-content-center"
                style={{ maxWidth: "400px" }}
            >
                Login with Google <FcGoogle className="ms-2" />
            </Button>

            {error && <p className="text-danger mt-2">{error}</p>}

            <p className="mt-3">Don't have an account? <a href="/register">Sign up</a></p>
        </Container>
    );
}
