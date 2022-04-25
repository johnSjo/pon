type PubSubCallback = (message?: any) => void;

interface PubSubSubscription {
  readonly topic: string;
  readonly callback: PubSubCallback;
}

class PubSub {
  private _subscriptions = [];

  constructor() {}

  public publish(topic: string, message?: any) {
    this._subscriptions
      .filter((subscription) => subscription.topic === topic)
      .forEach((subscription) => {
        subscription.callback(message);
      });
  }

  public subscribe(topic: string, callback: PubSubCallback) {
    const subscription: PubSubSubscription = {
      topic,
      callback,
    };

    this._subscriptions.push(subscription);

    return subscription;
  }

  public subscribeOnce(topic: string, callback: PubSubCallback) {
    const subscription = this.subscribe(topic, callback);
    const unsubscription = this.subscribe(topic, unsubscriber.bind(this));

    function unsubscriber() {
      this.unsubscribe(subscription);
      this.unsubscribe(unsubscription);
    }
  }

  public unsubscribe(subscription: PubSubSubscription) {
    const subscriptionIndex = this._subscriptions.indexOf(subscription);

    if (subscriptionIndex >= 0) {
      this._subscriptions.splice(subscriptionIndex, 1);
    }
  }
}

const PubSubInstance = new PubSub();
console.count('PubSubInstance');
export default PubSubInstance;
