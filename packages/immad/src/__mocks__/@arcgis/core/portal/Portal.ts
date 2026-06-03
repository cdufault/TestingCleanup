export default class Portal {
    load = async function () {
        return {
            message: 'Load method executed!',
        };
    };
    name = 'Test Portal';
    loaded = true;
    restUrl = 'http://cigt-srv19.esri.tech/portal/home/sharing/rest';
}
