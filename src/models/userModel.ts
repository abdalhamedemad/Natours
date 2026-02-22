import mongoose, { Document } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  photo?: string;
  password: string;
  passwordConfirm: string | undefined;
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
    validate: [validator.isURL, 'Enter a valid url'],
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: 8,
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
});

userSchema.pre('save', async function (this: IUser, next) {
  // we want to encrypt password only if the user modify it
  if (!this.isModified('password')) return next();

  // 12 is the salt the higher the more encryption but will be costly on the CPU
  this.password = await bcrypt.hash(this.password, 12);
  // Delete the password confirm field
  this.passwordConfirm = undefined;
  next();
});

// here we use the schema to build a model user so we can now use user to make a crud operation very easy
// here the convention that model name must start with a Capital letter
const User = mongoose.model('User', userSchema);

export default User;
