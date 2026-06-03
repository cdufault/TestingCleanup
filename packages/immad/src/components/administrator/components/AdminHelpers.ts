import { IItem, IUser } from '@esri/arcgis-rest-portal';

export class AdminHelpers {
    static filterUsersByArray(userItemsToFilter: IItem[], userNamesToFilterByArray: string[]): Array<IItem> {
        return userItemsToFilter.filter((user) => userNamesToFilterByArray.includes(user.username));
    }
    static removeUsersByArray(userItemsToFilter: IUser[], userNamesToRemoveFromArray: IUser[]): Array<IUser> {
        const listUserNamesToRemove: string[] = [];
        userNamesToRemoveFromArray.forEach((aUser) => {
            if (aUser.username != null) {
                listUserNamesToRemove.push(aUser.username);
            }
        });
        return userItemsToFilter.filter((user) => {
            if (user.username != null) {
                if (!listUserNamesToRemove.includes(user.username)) {
                    return user;
                }
            }
        });
    }
}
