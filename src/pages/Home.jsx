import { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, ListGroup, InputGroup, Modal, OverlayTrigger, Tooltip, ProgressBar } from "react-bootstrap";
import { useAuth } from "../useAuth";
import { FcMoneyTransfer } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase.js";
import Alert from "react-bootstrap/Alert";
import { getAiExpenseAdvice } from "../utils/aiExpenseAdvisor";

export default function Home() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [selectedItemName, setSelectedItemName] = useState(null);
    const [customIconUrl, setCustomIconUrl] = useState("");
    const [iconLoadFailures, setIconLoadFailures] = useState({});

    const [aiResponse, setAiResponse] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiProgress, setAiProgress] = useState(0);
    const [aiStatus, setAiStatus] = useState("");
    const [aiError, setAiError] = useState("");

    const navigate = useNavigate();

    const overallCost = items.reduce((sum, item) => sum + Number(item.price), 0);

    // Load expenses from Firestore
    useEffect(() => {
        if (!user) return;
        const loadExpenses = async () => {
            try {
                const userDoc = doc(db, "users", user.uid);
                const snapshot = await getDoc(userDoc);
                if (snapshot.exists()) {
                    const data = snapshot.data().expenses || {};
                    const expensesArray = Object.entries(data).map(([expenseName, expenseData]) => {
                        const isObject = typeof expenseData === 'object' && expenseData !== null;
                        return {
                            name: expenseName,
                            price: isObject ? expenseData.price : expenseData,
                            iconType: isObject ? (expenseData.iconType || "google") : "google",
                            customIconUrl: isObject ? (expenseData.customIconUrl || "") : "",
                        };
                    });
                    setItems(expensesArray);
                }
            } catch (err) {
                console.error("Error loading expenses:", err);
            }
        };

        const loadAI = async () => {
            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists()) {
                setAiResponse(snap.data().latestResponse || "");
            }
        };

        loadAI();
        loadExpenses();
    }, [user]);

    if (!user) {
        return (
            <Container className="mt-4 d-flex justify-content-center align-items-center flex-column" style={{ height: "80vh" }}>
                <h1 className="mb-3 text-center">Subwise - Your Expenses Manager</h1>
                <h5 className="mb-3 text-center">Manage your expenses, see how much you spend on them and get tips for saving money from AI.</h5>
                <Button onClick={() => navigate("/login")}>Login</Button>
                <p className="mt-3">Don't have an account? <a href="/subwise/register">Sign up</a></p>
                <p className="text-danger mt-3 fst-italic">You need to login to use Subwise.</p>
            </Container>
        );
    }

    const generateAI = async () => {
        if (items.length === 0) {
            setAiError("Add at least one expense before asking for AI advice.");
            return;
        }

        setAiLoading(true);
        setAiError("");
        setAiResponse("");
        setAiProgress(0.02);
        setAiStatus("Preparing TinyLlama...");

        try {
            const text = await getAiExpenseAdvice({
                userName: user.displayName || "User",
                expenses: items,
                onProgress: ({ phase, progress, text: statusText }) => {
                    setAiStatus(statusText);
                    setAiProgress(progress);
                    if (phase === "loading") {
                        setAiResponse("Downloading and preparing the local model...");
                    }
                },
                onPartialResponse: (partial) => {
                    setAiResponse(partial);
                },
            });

            setAiResponse(text);
            setAiProgress(1);
            setAiStatus("Advice ready.");

            await updateDoc(doc(db, "users", user.uid), {
                latestResponse: text,
            });
        } catch (err) {
            console.error("AI advice failed:", err);
            setAiError(err?.message || "TinyLlama could not be loaded right now.");
            setAiStatus("");
        } finally {
            setAiLoading(false);
        }
    };

    const updateFirestore = async (newItems) => {
        try {
            const userDoc = doc(db, "users", user.uid);
            const expenses = {};
            newItems.forEach(item => {
                expenses[item.name] = {
                    price: Number(item.price),
                    iconType: item.iconType || "google",
                    customIconUrl: item.customIconUrl || "",
                };
            });
            await setDoc(userDoc, { expenses }, { merge: true });
        } catch (err) {
            console.error("Error updating Firestore:", err);
        }
    };

    const addItem = () => {
        if (!name || !price) return;
        const newItems = [...items, { name, price: Number(price), iconType: "google", customIconUrl: "" }];
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

    const getItemIconSrc = (item) => {
        const iconType = item.iconType || "google";

        if (iconType === "placeholder") return null;
        if (iconType === "custom") return item.customIconUrl?.trim() || null;
        return getIconUrl(item.name);
    };

    const updateItemIcon = async (itemName, updates) => {
        const newItems = items.map((item) =>
            item.name === itemName
                ? { ...item, ...updates }
                : item
        );

        setItems(newItems);
        setIconLoadFailures((prev) => {
            const next = { ...prev };
            delete next[itemName];
            return next;
        });
        await updateFirestore(newItems);
    };

    const selectedItem = items.find((item) => item.name === selectedItemName) || null;

    const getIconLabel = (item) => `${item.name} icon`;

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-3">
                <Col>
                    <h3>Subwise - Expenses Manager</h3>
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
                                    <OverlayTrigger
                                        placement={index === 0 ? "top" : index === items.length - 1 ? "bottom" : "left"}
                                        overlay={<Tooltip id={`tooltip-${index}`}>Edit icon</Tooltip>}
                                    >
                                        <button
                                            type="button"
                                            className="subscriptop-icon-button btn-link p-0 border-0 bg-transparent"
                                            onClick={() => {
                                                setSelectedItemName(item.name);
                                                setCustomIconUrl(item.customIconUrl || "");
                                            }}
                                            aria-label={getIconLabel(item)}
                                        >
                                            {getItemIconSrc(item) && !iconLoadFailures[item.name] ? (
                                                <img
                                                    src={getItemIconSrc(item)}
                                                    alt={`${item.name} icon`}
                                                    width="24"
                                                    height="24"
                                                    onError={() => {
                                                        setIconLoadFailures((prev) => ({
                                                            ...prev,
                                                            [item.name]: true,
                                                        }));
                                                    }}
                                                />
                                            ) : (
                                                <FcMoneyTransfer size={24} />
                                            )}
                                        </button>
                                    </OverlayTrigger>
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

            <Modal
                show={!!selectedItem}
                onHide={() => {
                    setSelectedItemName(null);
                    setCustomIconUrl("");
                }}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Edit Icon</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-flex align-items-start gap-3">
                        <div className="subscriptop-modal-icon">
                            {selectedItem && getItemIconSrc(selectedItem) && !iconLoadFailures[selectedItem.name] ? (
                                <img
                                    src={getItemIconSrc(selectedItem)}
                                    alt={`${selectedItem.name} icon`}
                                    width="48"
                                    height="48"
                                    onError={() => {
                                        setIconLoadFailures((prev) => ({
                                            ...prev,
                                            [selectedItem.name]: true,
                                        }));
                                    }}
                                />
                            ) : (
                                <FcMoneyTransfer size={48} />
                            )}
                        </div>
                        <div>
                            <h3>{selectedItem?.name}</h3>
                            <p className="fw-semibold">€{selectedItem?.price}</p>

                            <p>Subwise can use Google's favicon, a custom URL, or a placeholder icon. Pick the mode you want for this expense.</p>

                            <div className="gap-2">
                                <div className="d-flex flex-column gap-2 f-direction-row">
                                    <input
                                        type="text"
                                        placeholder="Custom icon URL"
                                        className="form-control"
                                        value={customIconUrl}
                                        onChange={(e) => setCustomIconUrl(e.target.value)}
                                    />

                                    <Button
                                        variant="success"
                                        onClick={() => {
                                            if (!selectedItem) return;
                                            setCustomIconUrl(customIconUrl.trim());
                                            updateItemIcon(selectedItem.name, {
                                                iconType: "custom",
                                                customIconUrl: customIconUrl.trim(),
                                            });
                                        }}
                                    >
                                        Save
                                    </Button>
                                </div>

                                <div className="d-flex flex-column gap-2 f-direction-row mt-3">
                                    <Button
                                        className="mt-2"
                                        variant="secondary"
                                        onClick={() => {
                                            if (!selectedItem) return;
                                            updateItemIcon(selectedItem.name, {
                                                iconType: "google",
                                                customIconUrl: "",
                                            });
                                        }}
                                    >
                                        Use default Google Favicons
                                    </Button>
                                    <Button
                                        className="mt-2"
                                        variant="secondary"
                                        onClick={() => {
                                            if (!selectedItem) return;
                                            updateItemIcon(selectedItem.name, {
                                                iconType: "placeholder",
                                                customIconUrl: "",
                                            });
                                        }}
                                    >
                                        Use placeholder icon (<FcMoneyTransfer />)
                                    </Button>
                                </div>
                            </div>

                            <p className="text-body-secondary">Tap outside the modal or use the close button to return.</p>

                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            <div className="mt-3">
                <strong>
                    You are spending <span style={{ color: "var(--bs-primary)" }}>€{overallCost}</span> monthly.
                </strong>
            </div>

            <div className="mt-3">
                <div>
                <Button onClick={generateAI} disabled={aiLoading}>
                    {aiLoading ? "Thinking..." : "Get AI Advice"}
                </Button>

                <p className="text-body-secondary mt-2">
                    *Note that the AI runs locally and may generate unexpected or unaccurate responses.
                </p>
                </div>

                {aiLoading && (
                    <div className="mt-3">
                        <ProgressBar
                            animated
                            striped
                            now={Math.round(aiProgress * 100)}
                            label={`${Math.round(aiProgress * 100)}%`}
                        />
                        <div className="mt-2 small text-body-secondary">{aiStatus}</div>
                    </div>
                )}

                {aiError && (
                    <Alert variant="warning" className="mt-3">
                        {aiError}
                    </Alert>
                )}

                {aiResponse && (
                    <Alert variant="info" className="mt-3">
                        {aiResponse}
                    </Alert>
                )}
            </div>
        </Container>
    );
}
