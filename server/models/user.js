module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    userName: {
      type: DataTypes.STRING,
      required: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    instanceMethods: {
      toJSON: () => {
        const values = Object.assign({}, this.get());
        delete values.password;
        return values;
      }
    }
  });

  // User.associate = (models) => {
  //   User.hasMany(models.UserRole, {
  //     foreignKey: 'userId',
  //     as: 'userRoles',
  //   });
  // };

  return User;
};
