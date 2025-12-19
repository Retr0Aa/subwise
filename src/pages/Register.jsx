import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { Form, Button, Container } from "react-bootstrap";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!email || !password) return;

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            navigate("/");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Container
            className="d-flex justify-content-center align-items-center flex-column"
            style={{ height: "80vh" }}
        >
            <h1 className="mb-4">Register</h1>

            <Form onSubmit={handleRegister} className="d-flex flex-column align-items-center w-100" style={{ maxWidth: "400px" }}>
                <Form.Group className="mb-2 w-100">
                    <Form.Control
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </Form.Group>

                <Form.Group className="mb-3 w-100">
                    <Form.Control
                        type="password"
                        placeholder="Password"
                        value={password}
                        required
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </Form.Group>

                <Button className="w-100" size="lg" type="submit" variant="success">Register</Button>
            </Form>

            {error && <p className="text-danger mt-2">{error}</p>}

            <p className="mt-3">Already have an account? <a href="/login">Log in</a></p>
        </Container>
    );
}
