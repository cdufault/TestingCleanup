export default class IdentityManager {
    static getCredential = async function (url: string) {
        return {
            token: 'identity_manager_test_token',
            server: url,
            userId: 'ADMIN_01',
        };
    };
}
