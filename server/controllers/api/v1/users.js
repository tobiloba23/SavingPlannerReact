import bcrypt from 'bcrypt-nodejs';
import jwt from 'jsonwebtoken';
import validator from 'validatorjs';
import dotenv from 'dotenv';
import models from '../../../models';

dotenv.config();

const { User } = models;
let token;
const dberror = process.env.DB_ERROR;

export default {
  list(req, res) {
    User
      .findAll({
        attributes: ['userName', 'imageUrl'],
      })
      .then((users) => {
        if (!users) {
          res.status(404).json({
            error: {
              message: 'No Users Found',
            }
          });
        } else {
          res.status(200).json({
            data: users
          });
        }
      })
      .catch(serverError => res.status(500).json({
        error: {
          message: `${dberror} find the user on the datadase`,
          serverError
        }
      }));
  },

  listOne(req, res) {
    User
      .findById(
        req.decoded.id,
        {
          attributes: ['userName', 'email', 'firstName', 'lastName', 'imageUrl'],
        }
      )
      .then((user) => {
        res.status(200).json({
          data: user
        });
      })
      .catch(serverError => res.status(500).json({
        error: {
          message: `${dberror} find the user on the datadase`,
          serverError
        }
      }));
  },

  async signup(req, res) {
    const rules = {
      userName: 'required|string',
      email: 'required|email',
      /* Minimum 8 and maximum 16 characters, at least one uppercase letter,
      one lowercase letter, one number and one special character */
      password: 'required|alpha_dash',
      passwordConfirmation: 'required|same:password',
      firstName: 'required|string',
      lastName: 'required|string',
    };

    const isValid = new validator(req.body, rules);
    if (isValid.fails()) {
      res.status(422).json({
        error: {
          message: isValid.errors.all()
        }
      });
    } else {
      let response;
      await User
        .find({
          where: {
            userName: req.body.userName
          }
        })
        .then((user) => {
          if (user) {
            response = {
              error: {
                message: `${user.userName} has already been taken`,
              }
            };
          }
        });
      await User
        .find({
          where: {
            email: req.body.email
          }
        })
        .then((user) => {
          if (user) {
            response = {
              error: {
                message: `An account has already been created for ${user.email}`,
              }
            };
          }
        });
      if (response) {
        res.status(409).json(response);
      } else {
        User
          .create({
            userName: req.body.userName,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password.trim(), bcrypt.genSaltSync(8)),
            firstName: req.body.firstName,
            lastName: req.body.lastName,
          })
          .then((user) => {
            const day = 60 * 60 * 24; // expires in 24 hours

            // create a token with only our given payload
            token = jwt.sign(
              { id: user.userId },
              process.env.JWT_SEC_KEY,
              {
                expiresIn: day
              }
            );

            res.status(201).json({
              message: `User ${user.userName}'s has successfully been created.`,
              userName: user.userName,
              token,
              expiresIn: day
            });
          })
          .catch(serverError => res.status(500).json({
            error: {
              message: `${dberror} create the user on the datadase`,
              serverError
            }
          }));
      }
    }
  },

  signin(req, res) {
    const rules = {
      userName: 'required|string',
      password: 'required|alpha_dash',
    };

    const isValid = new validator(req.body, rules);
    if (isValid.fails()) {
      res.status(422).json({
        error: {
          message: isValid.errors.all()
        }
      });
    } else {
      User
        .find({
          where: {
            userName: req.body.userName
          }
        })
        .then((user) => {
          if (!user) {
            res.status(404).json({
              error: {
                message: 'User Not Found',
              }
            });
          } else if (!bcrypt.compareSync(req.body.password.trim(), user.password)) {
            res.status(404).json({
              error: {
                message: 'The username and password do not match our records.'
              }
            });
          } else {
            const day = 60 * 60 * 24; // expires in 24 hours

            // create a token with only our given payload
            token = jwt.sign(
              { id: user.userId },
              process.env.JWT_SEC_KEY,
              {
                expiresIn: day
              }
            );

            res.status(200).json({
              success: {
                message: 'User authenticated',
              },
              userName: user.userName,
              imageUrl: user.imageUrl,
              token,
              expiresIn: day
            });
          }
        })
        .catch(serverError => res.status(500).json({
          error: {
            message: `${dberror} find the user on the datadase`,
            serverError
          }
        }));
    }
  },

  update(req, res) {
    User
      .find({
        where: {
          userName: req.body.userName
        }
      })
      .then((userWithSameUserName) => {
        if (userWithSameUserName) {
          res.status(409).json({
            error: {
              message: `${userWithSameUserName.userName} has already been taken`,
            }
          });
        } else {
          User
            .findById(req.decoded.id)
            .then((user) => {
              if (!user) {
                res.status(404).json({
                  error: {
                    message: 'User Not Found',
                  }
                });
              } else {
                const updateData = {
                  userName: req.body.userName || user.userName,
                  firstName: req.body.firstName || user.firstName,
                  lastName: req.body.lastName || user.lastName,
                  imageUrl: req.body.imageUrl || user.imageUrl
                };
                if (req.body.password) updateData.password = req.body.password;
                user
                  .update(updateData, { fields: Object.keys(updateData) })
                  .then(() => {
                    delete updateData.password;
                    updateData.email = user.email;
                    res.status(202).json({
                      message: `${user.email}'s account has successfully been updated.`,
                      data: updateData
                    });
                  })
                  .catch(serverError => res.status(500).json({
                    error: {
                      message: `${dberror} update the user details on the datadase`,
                      serverError
                    }
                  }));
              }
            })
            .catch(serverError => res.status(500).json({
              error: {
                message: `${dberror} find the user on the datadase`,
                serverError
              }
            }));
        }
      });
  },

  delete(req, res) {
    User
      .find({
        where: {
          userId: req.decoded.id,
        }
      })
      .then((user) => {
        if (!user) {
          res.status(404).json({
            error: {
              message: 'User Not Found',
            }
          });
        } else {
          const deletedUser = {
            userName: user.userName,
            firstName: user.firstName,
            lastName: user.lastName
          };
          user
            .destroy()
            .then(() => res.status(200).json({
              message: 'The user listed below has just been deleted',
              data: deletedUser
            }))
            .catch(serverError => res.status(500).json({
              error: {
                message: `${dberror} delete the user from the datadase`,
                serverError
              }
            }));
        }
      })
      .catch(serverError => res.status(500).json({
        error: {
          message: `${dberror} find the user on the datadase`,
          serverError
        }
      }));
  }
};
