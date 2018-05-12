import chai from 'chai';
import supertest from 'supertest';
import Faker from 'faker';
import app from '../../../server/app';

const should = chai.should();

// This agent refers to PORT where program is runninng.

const server = supertest(app);
let userToken, noUserToken;
const firstName = Faker.name.firstName(),
  lastName = Faker.name.lastName(),
  email = Faker.internet.email(),
  userName = Faker.internet.userName(),
  password = '123_abc',
  passwordConfirmation = '123_abc';

// UNIT test begin

describe('/Users unit test', () => {
  before(() => {
    server
      .get('/api/v2/get-token')
      .end((err, res) => {
        noUserToken = res.body.token;
      });
  });

  const registerDetails = {
    firstName,
    lastName,
    email,
    userName,
    password,
    passwordConfirmation
  };
  const registerSameEmail = {
    firstName: Faker.name.firstName(),
    lastName: Faker.name.lastName(),
    email,
    userName: Faker.internet.email(),
    password,
    passwordConfirmation
  };
  const registerSameUserName = {
    firstName: Faker.name.firstName(),
    lastName: Faker.name.lastName(),
    email: Faker.internet.email(),
    userName,
    password,
    passwordConfirmation
  };
  const loginDetails = {
    userName,
    password
  };
  const registerNotEmail = {
    firstName: 'Rexford',
    lastName: 'Rexford',
    userName: 'username',
    password,
    passwordConfirmation
  };
  const registerNotPassword = {
    firstName: 'Rexford',
    lastName: 'Rexford',
    email: 'email@email',
    userName: 'username',
    password: '123_abc    $',
    passwordConfirmation
  };
  const updateUserExistingUsername = {
    firstName: 'Rexford',
    lastName: 'Rexford',
    email: 'email@email',
    userName: 'username',
    password,
    passwordConfirmation
  };
  const updateUserDetails = {
    firstName: 'Rexford',
    lastName: 'Rexford',
    email: 'email@email',
    userName: Faker.internet.email(),
    password,
    passwordConfirmation
  };


  // #1 sholud return 404
  it('GET /random should return 404', () => {
    server
      .get('/api/v2/random')
      .expect('Content-type', /html/)
      .expect(404);
  });

  // #2 register should fail on missing required details
  it('POST /users/signup register should fail on missing required details', (done) => {
    server
      .post('/api/v2/users/signup')
      .send()
      .expect('Content-type', /json/)
      .expect(422)
      .end((err, res) => {
        res.status.should.equal(422);
        res.body.error.message.firstName.should.be.a('array');
        res.body.error.message.lastName.should.be.a('array');
        res.body.error.message.userName.should.be.a('array');
        res.body.error.message.email.should.be.a('array');
        res.body.error.message.password.should.be.a('array');
        res.body.error.message.passwordConfirmation.should.be.a('array');
        should.not.exist(res.body.token);
        done();
      });
  });

  // #3 register should fail on invalid email supplied
  it('POST /users/signup register should fail on invalid email supplied', (done) => {
    server
      .post('/api/v2/users/signup')
      .send(registerNotEmail)
      .expect('Content-type', /json/)
      .expect(422)
      .end((err, res) => {
        res.status.should.equal(422);
        res.body.error.message.email.should.be.a('array');
        should.not.exist(res.body.token);
        done();
      });
  });

  // #4 register should fail on invalid password supplied
  // The password field may only contain alpha-numeric characters,
  // as well as dashes and underscores.
  it('POST /users/signup register should fail on invalid password supplied', (done) => {
    server
      .post('/api/v2/users/signup')
      .send(registerNotPassword)
      .expect('Content-type', /json/)
      .expect(422)
      .end((err, res) => {
        res.status.should.equal(422);
        res.body.error.message.password.should.be.a('array');
        should.not.exist(res.body.token);
        done();
      });
  });

  // #5 should create account or return account already exists
  // #5 should allow a new user register and be automatically logged in
  it('POST /users/signup should allow a user register and be automatically logged in', (done) => {
    server
      .post('/api/v2/users/signup')
      .send(registerDetails)
      .expect('Content-type', /json/)
      .end((err, res) => {
        if (res.body.error) {
          res.status.should.equal(409);
          res.body.error.message.should.equal(`An account has already been created for ${registerDetails.email}`);
          done();
        }
        res.status.should.equal(201);
        should.not.exist(res.body.error);
        should.exist(res.body.token);
        userToken = res.body.token;
        done();
      });
  });

  // #6 should not allow a new user register multiple accounts with a single email
  it('POST /users/signup not should allow a user register multiple accounts with a single email', (done) => {
    server
      .post('/api/v2/users/signup')
      .send(registerSameEmail)
      .expect('Content-type', /json/)
      .end((err, res) => {
        res.status.should.equal(409);
        res.body.error.message.should.equal(`An account has already been created for ${registerDetails.email}`);
        should.not.exist(res.body.token);
        done();
      });
  });

  // #7 userNames for all accounts in the database must be unique
  it('POST /users/signup should restrict users from taking userNames which have already been assigned to another account', (done) => {
    server
      .post('/api/v2/users/signup')
      .send(registerSameUserName)
      .expect('Content-type', /json/)
      .end((err, res) => {
        res.status.should.equal(409);
        res.body.error.message.should.equal(`${registerDetails.userName} has already been taken`);
        should.not.exist(res.body.token);
        done();
      });
  });

  // #8 should allow a new user signin
  it('POST /users/signin should allow a user signin', (done) => {
    server
      .post('/api/v2/users/signin')
      .send(loginDetails)
      .expect('Content-type', /json/)
      .end((err, res) => {
        res.status.should.equal(200);
        should.not.exist(res.body.error);
        should.exist(res.body.token);
        userToken = res.body.token;
        done();
      });
  });

  // #9 should return all users
  it('GET /users should return all users', (done) => {
    server
      .get('/api/v2/users')
      .expect('Content-type', /json/)
      .end((err, res) => {
        res.status.should.equal(401);
        res.body.error.message.should.equal('No token provided.');
        done();
      });
  });

  // #10 should return all users
  it('GET /users should return all users', (done) => {
    server
      .get('/api/v2/users').set('x-access-token', userToken)
      .expect('Content-type', /json/)
      .end((err, res) => {
        if (res.body.error) {
          res.status.should.equal(404);
          res.body.error.message.should.equal('No Users Found');
          done();
        }
        res.status.should.equal(200);
        should.not.exist(res.body.error);
        done();
      });
  });

  // #11 should allow a registered user view his profile
  it('GET /user/profile should allow a registered user view his profile', (done) => {
    server
      .get('/api/v2/user/profile').set({ 'x-access-token': userToken })
      .expect('Content-type', /json/)
      .end((err, res) => {
        res.status.should.equal(200);
        should.exist(res.body.data.userName);
        should.not.exist(res.body.error);
        done();
      });
  });

  // #12 should not allow a user update their details to contain a userName that already exists
  it('PUT /users update should fail on userName already exists', (done) => {
    server
      .put('/api/v2/users')
      .send(updateUserExistingUsername).set({ 'x-access-token': userToken })
      .expect('Content-type', /json/)
      .end((err, res) => {
        res.status.should.equal(409);
        res.body.error.message.should.equal(`${updateUserExistingUsername.userName} has already been taken`);
        done();
      });
  });

  // #13 should allow a user update their details
  it('PUT /users should allow a user update their details', (done) => {
    server
      .put('/api/v2/users')
      .send(updateUserDetails).set({ 'x-access-token': userToken })
      .expect('Content-type', /json/)
      .end((err, res) => {
        res.status.should.equal(202);
        res.body.data.userName.should.equal(updateUserDetails.userName);
        res.body.data.email.should.equal(registerDetails.email);
        res.body.data.firstName.should.equal(updateUserDetails.firstName);
        res.body.data.lastName.should.equal(updateUserDetails.lastName);
        should.not.exist(res.body.error);
        done();
      });
  });

  // #14 should allow a registered user view recipes created by all users
  it('GET /user/recipes/:userName should allow a registered user view recipes created by all users', (done) => {
    server
      .get(`/api/v2/user/recipes/${userName}`).set({ 'x-access-token': userToken })
      .expect('Content-type', /json/)
      .end((err, res) => {
        res.status.should.equal(200);
        res.body.data.should.be.a('array');
        should.not.exist(res.body.error);
        done();
      });
  });

  // #15 should return all users
  it('GET /users should return all users', (done) => {
    server
      .get('/api/v2/users').set('x-access-token', noUserToken)
      .expect('Content-type', /json/)
      .end((err, res) => {
        if (res.body.error) {
          res.status.should.equal(404);
          res.body.error.message.should.equal('No Users Found');
          done();
        }
        res.status.should.equal(200);
        should.not.exist(res.body.error);
        done();
      });
  });

  // #16 should return all users
  it('GET /users should return all users', (done) => {
    server
      .get('/api/v2/users').set('x-access-token', userToken)
      .expect('Content-type', /json/)
      .end((err, res) => {
        if (res.body.error) {
          res.status.should.equal(404);
          res.body.error.message.should.equal('No Users Found');
          done();
        }
        res.status.should.equal(200);
        should.not.exist(res.body.error);
        done();
      });
  });

  // #17 should delete user
  it('DELETE /users should delete user', (done) => {
    server
      .delete('/api/v2/users').set('x-access-token', userToken)
      .expect('Content-type', /json/)
      .end((err, res) => {
        if (res.body.error) {
          res.status.should.equal(404);
          res.body.error.message.should.equal('User Not Found');
          done();
        }
        res.status.should.equal(200);
        res.body.data.userName.should.equal(updateUserDetails.userName);
        res.body.data.firstName.should.equal(updateUserDetails.firstName);
        res.body.data.lastName.should.equal(updateUserDetails.lastName);
        should.not.exist(res.body.error);
        done();
      });
  });
});
