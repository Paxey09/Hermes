import { Link } from 'react-router-dom';

function Client_Dashboard() {
    return (
        <div className="Client-dashboard">
            <h1>Client Dashboard</h1>
            <p>Welcome to the client dashboard. Here you can view your information, manage your account, and access various features.</p>
            <Link to="/ClientHermesChatbot">Open Hermes Chatbot</Link>
        </div>
    );
}

export default Client_Dashboard;