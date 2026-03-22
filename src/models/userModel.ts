import mongoose, { Document, Query } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IUser extends Document {
  name: string;
  email: string;
  photo?: string;
  password: string | undefined;
  passwordConfirm: string | undefined;
  passwordChangedAt: Date;
  role: string;
  passwordResetToken: string;
  passwordResetExpires: Date;
}
const userSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
    trim: true,
    maxLength: [40, 'A user name must have less or equal 40 characters'],
    minLength: [10, 'A user name must have more or equal 10 characters'],
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    unique: [true, 'This Email used before'],
    // this will convert the email into lowercase
    lowerCase: true,
    validate: [validator.isEmail, 'Enter a valid email'],
  },
  photo: {
    type: String,
    // required: [true, 'A user must have a photo'],
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: 8,
    // means never shows when makes a query
    select: false,
    // validate: [validator.isStrongPassword, 'Enter a strong password'],
  },
  // we only add this field in order of a validation in DB
  passwordConfirm: {
    type: String,
    required: [true, 'Please Confirm your password'],
    validate: {
      // only works on Create and Save not in findbyIDandupdate use only save even if in the update
      validator: function (this: IUser, el: string) {
        return this.password === el;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  // for deleted account we just set to in active not deleted
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// we add hashing here to separate business logic to be here
userSchema.pre('save', async function (this: IUser, next) {
  // we want to encrypt password only if the user modify it
  if (!this.isModified('password')) return next();

  // 12 is the salt the higher the more encryption but will be costly on the CPU
  this.password = await bcrypt.hash(this.password as string, 12);
  // Delete the password confirm field
  this.passwordConfirm = undefined;
  next();
});

// change the password changed at after only resiting the password
userSchema.pre('save', async function (this: IUser, next) {
  // check if not modified or this document is new return
  if (!this.isModified('password') || this.isNew) return next();

  // to ensure that alway the token always created after this date bec/ we check in the above for that
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// regex to select all start wil find findbyid and findandupdate...
// here before any query we just needs to not select the inactive users
userSchema.pre(/^find/, function (this: Query<any, IUser>, next) {
  // this points to the current query we can chain more filteration
  this.find({ active: { $ne: false } });
  next();
});

//  this instance methods will be available in the user document we add it here because it's related to the data
userSchema.methods.checkCorrectPassword = async function (
  candidatePassword,
  userPassword,
) {
  const res = await bcrypt.compare(candidatePassword, userPassword);
  return res;
};

userSchema.methods.changedPasswordAfter = function (
  this: IUser,
  JWTTimeStamp: number,
) {
  if (this.passwordChangedAt) {
    // convert date into time stamp as in seconds with getTime and divided by 1000 to convert into seconds
    // ,10 for the parsing base 10
    const changedTimeStamp = this.passwordChangedAt.getTime() / 1000;
    return JWTTimeStamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function (this: IUser) {
  // will generate just small random token using crypto
  const resetToken = crypto.randomBytes(32).toString('hex');
  // this token will send to the user's email to reset it's password
  // this behave as a user password so we could't save it as a plain text to the DB
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // will expires after ten minutes
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 60 * 1000);
  return resetToken;
};
// here we use the schema to build a model user so we can now use user to make a crud operation very easy
// here the convention that model name must start with a Capital letter
const User = mongoose.model('User', userSchema);

export default User;
