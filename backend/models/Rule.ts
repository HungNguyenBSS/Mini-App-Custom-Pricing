import { DataTypes, Model } from 'sequelize';
import { sequelize } from './index.js';

export class Rule extends Model {
  declare id: number;
  declare name: string;
  declare status: 'enable' | 'disable';
  declare priority: number;
  declare applyTo: 'all' | 'tags';
  declare tags: string[];
  declare priceType: string;
  declare amount: number;
  declare productIds: string[];
}

Rule.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'enable',
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  applyTo: {
    type: DataTypes.STRING,
  },
  tags: {
    type: DataTypes.JSON, // Use JSON for arrays in MySQL
    defaultValue: [],
  },
  priceType: {
    type: DataTypes.STRING,
  },
  amount: {
    type: DataTypes.FLOAT,
  },
  productIds: {
    type: DataTypes.JSON,
    defaultValue: [],
  }
}, {
  sequelize,
  tableName: 'rules',
});
