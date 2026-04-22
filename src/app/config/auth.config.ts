export interface CognitoConfig {
    region: string;
    authority: string;
    userPoolDomain: string;
    clientId: string;
    redirectUri: string;
    responseType: string;
    scopes: string[];
}

export interface WebSocketConfig {
    url: string;
}

export interface ApiConfig {
    managementEndpoint: string;
}

export interface AppDefaults {
    siteId: string;
}

export interface AppConfig {
    cognito: CognitoConfig;
    websocket: WebSocketConfig;
    api: ApiConfig;
    defaults: AppDefaults;
    storageKeys: {
        accessToken: string;
        idToken: string;
        refreshToken: string;
        tokenExpiry: string;
        pkceVerifier: string;
        oauthState: string;
    };
}

export const authConfig: AppConfig = {
    cognito: {
        region: 'ap-southeast-1',
        authority: 'https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_XAEIg3F0k',
        userPoolDomain: 'ap-southeast-1xaeig3f0k.auth.ap-southeast-1.amazoncognito.com',
        clientId: '35q0rt3r7g5mrua64rk4m2u307',
        redirectUri: 'http://localhost:64108/dashboard',
        responseType: 'code',
        scopes: ['email', 'openid', 'phone']
    },
    websocket: {
        url: 'wss://nk29fyanpb.execute-api.ap-southeast-1.amazonaws.com/dev'
    },
    api: {
        managementEndpoint: 'https://nk29fyanpb.execute-api.ap-southeast-1.amazonaws.com/dev'
    },
    defaults: {
        siteId: 'SITE_001'
    },
    storageKeys: {
        accessToken: 'dashboard_access_token',
        idToken: 'dashboard_id_token',
        refreshToken: 'dashboard_refresh_token',
        tokenExpiry: 'dashboard_token_expiry',
        pkceVerifier: 'pkce_verifier',
        oauthState: 'oauth_state'
    }
};