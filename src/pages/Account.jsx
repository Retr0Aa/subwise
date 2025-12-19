import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { signOut, updateProfile } from "firebase/auth";
import { auth } from "../config/firebase";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function Account() {
    const { user } = useAuth();
    const [name, setName] = useState(user.displayName || "");
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    const handleUpdateName = async () => {
        try {
            await updateProfile(user, { displayName: name });
            setMessage(<p className="text-success">Name updated!</p>);
        } catch (err) {
            setMessage(<p className="text-danger">{err.message}</p>);
        }
    };

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-3">
                <Col>
                    <h2>Account Info</h2>
                </Col>
                <Col xs="auto">
                    <Button variant="secondary" onClick={() => navigate("/")}>Go Home</Button>
                </Col>
            </Row>

            <p>Email: {user.email}</p>
            <p>Login method: {user.providerData[0].providerId}</p>

            <Form.Control className="mb-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
            <Button onClick={handleUpdateName}>Update Name</Button>

            <br /><br />
            <Button variant="danger" onClick={handleLogout}>Logout</Button>

            {message}
        </Container>
    );
}
