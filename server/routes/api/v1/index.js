import express from 'express';
import jwtCreate from 'jsonwebtoken';
import jwt from '../../../middleware/auth/local';
import Controller from '../../../controllers';

const router = express.Router();
const usersController = Controller.usersApiv1;


router.route('/get-token').get((req, res) => {
  const token = jwtCreate.sign(
    { foo: 'foo' },
    process.env.JWT_SEC_KEY, {
      expiresIn: 300 // expires 5mins
    }
  );
  res.json({ token });
});


// Authentication
router.route('/users/signup').post(usersController.signup);
router.route('/users/signin').post(usersController.signin);
router.route('/users').get(jwt, usersController.list);
router.route('/users').put(jwt, usersController.update);
router.route('/users').delete(jwt, usersController.delete);

// User Activities
router.route('/user/profile').get(jwt, usersController.listOne);

export default router;
