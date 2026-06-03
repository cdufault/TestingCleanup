import React, { useEffect, useContext, useState } from 'react';
import { AppContext } from '../../contexts/App';
import './header.scss';

import appLogo from '../../images/logo.png';
import PortalGroup from '@arcgis/core/portal/PortalGroup';

interface HeaderProps {
    appTitle: string;
}

export function Header({ appTitle }: HeaderProps): JSX.Element {
    const { portalUser } = useContext(AppContext);
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('');
    const [groups, setGroups] = useState<PortalGroup[]>([]);

    useEffect(() => {
        if (portalUser) {
            setUsername(portalUser.username);
            setRole(portalUser.role);
            portalUser.fetchGroups().then((val) => {
                setGroups(val);
            });
        }
    }, [portalUser]);

    return (
        <header className='header'>
            <div>
                <img className='logo' src={appLogo} />
                <span className='title'>{appTitle}</span>
            </div>
            <div className='user' title={`Role: ${role}\r\nGroups: ${groups.map((g) => g.title).join(' ,')}`}>
                {username ? username : '...'}
            </div>
        </header>
    );
}
