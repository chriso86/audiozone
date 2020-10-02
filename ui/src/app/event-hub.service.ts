import {Injectable} from '@angular/core';
import {EventHubConsumerClient, EventHubProducerClient} from '@azure/event-hubs';
import {ContainerClient} from '@azure/storage-blob';
import {BlobCheckpointStore} from '@azure/eventhubs-checkpointstore-blob';

@Injectable()
export class EventHubService {
  connectionString = 'HostName=SHowTell.azure-devices.net;DeviceId=BigBrother;SharedAccessKey=O6Hg2NCBgm0hNIjt0S1XQaZbps2JRTj69l/8DDSTw0s=';
  eventHubName = 'SHowTell';
  consumerGroup = '$Default'; // name of the default consumer group
  storageConnectionString = 'AZURE STORAGE CONNECTION STRING';
  containerName = 'BLOB CONTAINER NAME';

  data = [];

  async send(events: string[]): Promise<any> {

    // Create a producer client to send messages to the event hub.
    const producer = new EventHubProducerClient(this.connectionString, this.eventHubName);

    // Prepare a batch of three events.
    const batch = await producer.createBatch();

    events.forEach(event => {
      batch.tryAdd({body: event});
    });

    // Send the batch to the event hub.
    await producer.sendBatch(batch);

    // Close the producer client.
    await producer.close();

    console.log('A batch of three events have been sent to the event hub');
  }

  async receive(): Promise<any> {
    // Create a blob container client and a blob checkpoint store using the client.
    const containerClient = new ContainerClient(
      this.storageConnectionString,
      this.containerName
    );
    const checkpointStore = new BlobCheckpointStore(containerClient);

    // Create a consumer client for the event hub by specifying the checkpoint store.
    const consumerClient = new EventHubConsumerClient(
      this.consumerGroup,
      this.connectionString,
      this.eventHubName,
      checkpointStore
    );

    // Subscribe to the events, and specify handlers for processing the events and errors.
    const subscription = consumerClient.subscribe({
        processEvents: async (events, context) => {
          for (const event of events) {
            this.data.push(event);

            console.log(`Received event: '${event.body}' from partition: '${context.partitionId}' and consumer group: '${context.consumerGroup}'`);
          }
          // Update the checkpoint.
          await context.updateCheckpoint(events[events.length - 1]);
        },

        processError: async (err, context) => {
          console.log(`Error : ${err}`);
        }
      }
    );

    // After 30 seconds, stop processing.
    await new Promise((resolve) => {
      setTimeout(async () => {
        await subscription.close();
        await consumerClient.close();
        resolve();
      }, 30000);
    });
  }
}
