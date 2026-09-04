import Stripe from "stripe"
import envConfig from "../envConfig"

export const stripe = new Stripe(envConfig.stripe_secret_key)
