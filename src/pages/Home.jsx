import { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, ListGroup, InputGroup } from "react-bootstrap";
import { useAuth } from "../AuthContext";
import { MdSubscriptions } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { doc, collection, getDoc, setDoc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "../config/firebase.js"; // make sure your firebase is initialized

export default function Home() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");

    const navigate = useNavigate();

    const overallCost = items.reduce((sum, item) => sum + Number(item.price), 0);

    // Load subscriptions from Firestore
    useEffect(() => {
        if (!user) return;
        const loadSubscriptions = async () => {
            try {
                const userDoc = doc(db, "users", user.uid);
                const snapshot = await getDoc(userDoc);
                if (snapshot.exists()) {
                    const data = snapshot.data().subscriptions || {};
                    const subsArray = Object.entries(data).map(([subName, cost]) => ({
                        name: subName,
                        price: cost,
                    }));
                    setItems(subsArray);
                }
            } catch (err) {
                console.error("Error loading subscriptions:", err);
            }
        };
        loadSubscriptions();
    }, [user]);

    if (!user) {
        return (
            <Container className="mt-4 d-flex justify-content-center align-items-center flex-column" style={{ height: "80vh" }}>
                <h1 className="mb-3 text-center">Subwise - Your Subscription Manager</h1>
                <h5 className="mb-3 text-center">Manage your subscriptions, see how much you spend on them and get tips for saving money from AI.</h5>
                <Button onClick={() => navigate("/login")}>Login</Button>
                <p className="mt-3">Don't have an account? <a href="/register">Sign up</a></p>
                <p className="text-danger mt-3 fst-italic">You need to login to use Subwise.</p>
            </Container>
        );
    }

    const updateFirestore = async (newItems) => {
        try {
            const userDoc = doc(db, "users", user.uid);
            const subscriptions = {};
            newItems.forEach(item => {
                subscriptions[item.name] = Number(item.price);
            });
            await setDoc(userDoc, { subscriptions }, { merge: true });
        } catch (err) {
            console.error("Error updating Firestore:", err);
        }
    };

    const addItem = () => {
        if (!name || !price) return;
        const newItems = [...items, { name, price: Number(price) }];
        setItems(newItems);
        setName("");
        setPrice("");
        updateFirestore(newItems);
    };

    const removeItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        updateFirestore(newItems);
    };

    const getIconUrl = (name) => {
        if (!name) return null;
        const cleanName = name.toLowerCase().trim();
        const map = {
            "youtube premium": "youtube.com",
            "icloud+": "icloud.com",
            "spotify": "spotify.com",
            "netflix": "netflix.com",
            "hbo max": "hbomax.com",
            "amazon prime": "primevideo.com",
            "disney+": "disney.com",
            "apple one": "apple.com",
            "playstation plus": "playstation.com",
            "xbox game pass": "xbox.com",
            "apple arcade": "apple.com",
            "adobe creative cloud": "adobe.com",
        };
        let domain = map[cleanName];
        if (!domain) domain = cleanName.replace(/[^a-z0-9]/g, "") + ".com";
        return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
    };

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-3">
                <Col>
                    <h3>Subwise - Subscription Manager</h3>
                </Col>
                <Col xs="auto">
                    <Button onClick={() => navigate("/account")}>Account</Button>
                </Col>
            </Row>

            <Row className="mb-2">
                <Col>
                    <Form.Control
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </Col>
            </Row>

            <Row className="mb-3">
                <Col>
                    <InputGroup>
                        <Form.Control
                            type="number"
                            placeholder="Price"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                        <InputGroup.Text>€</InputGroup.Text>
                    </InputGroup>
                </Col>
                <Col xs="auto">
                    <Button variant="success" onClick={addItem}>Add</Button>
                </Col>
            </Row>

            <div className="p-3 bg-body-secondary rounded">
                {items.length === 0 ? (
                    <small className="fst-italic text-body-secondary">It’s empty.</small>
                ) : (
                    <ListGroup>
                        {items.map((item, index) => (
                            <ListGroup.Item
                                key={index}
                                className="d-flex align-items-center justify-content-between mb-2 border-0"
                            >
                                <div className="d-flex align-items-center gap-2">
                                    {getIconUrl(item.name) ? (
                                        <img
                                            src={getIconUrl(item.name)}
                                            alt=""
                                            width="24"
                                            height="24"
                                            onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
                                        />
                                    ) : (
                                        <MdSubscriptions size={24} />
                                    )}
                                    <span>{item.name} — €{item.price}</span>
                                </div>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => removeItem(index)}
                                >
                                    Remove
                                </Button>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </div>

            <div className="mt-3">
                <strong>
                    You are spending <span style={{ color: "var(--bs-primary)" }}>€{overallCost}</span> monthly.
                </strong>
            </div>
        </Container>
    );
}
