import React from 'react';

const AIIAChatView: React.FC = () => {
    return (
        <div className="w-full h-full bg-white rounded-xl shadow-md overflow-hidden">
            <iframe
                src="https://chatwoot.nandus.com.br/app/accounts/1/dashboard"
                title="AIIA Chat"
                className="w-full h-full border-0"
                style={{ height: 'calc(100vh - 8rem)' }}
            />
        </div>
    );
};

export default AIIAChatView;
