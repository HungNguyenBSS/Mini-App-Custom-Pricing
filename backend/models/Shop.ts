import { DataTypes, Model } from 'sequelize';
import { sequelize } from './index.js';

export class Shop extends Model {
  declare id: string;
  declare shopDomain: string;
  declare accessToken: string;
  declare name: string;
}

Shop.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
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
  status: {
  type: DataTypes.STRING,
  defaultValue: 'active',
},
}, {
  sequelize,
  tableName: 'shops',
});