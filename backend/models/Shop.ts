import { DataTypes, Model } from 'sequelize';
import { sequelize } from './index.js';

export class Shop extends Model {
  declare id: string;
  declare shopDomain: string;
  declare accessToken: string;
  declare name: string;
  declare senderEmail: string;
  declare senderEmailEnabled: boolean;
}

Shop.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  shopDomain: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  accessToken: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  senderEmail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  senderEmailEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  sequelize,
  tableName: 'shops',
});