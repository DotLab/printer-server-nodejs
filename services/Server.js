module.exports = class Server {
  constructor(storage, tempPath) {
    this.storage = storage;
    this.tempPath = tempPath;
    this.bucketName = 'printer-static';
    this.bukcet = storage.bucket(this.bucketName);
  }

  bucketUploadPublic(file, destination) {
    return this.bukcet.upload(file, {
      destination, metadata: {
        gzip: true,
        cacheControl: 'public, max-age=31536000',
        acl: [{entity: 'allUsers', role: this.storage.acl.READER_ROLE}],
      },
    });
  }

  bucketUploadPrivate(file, destination) {
    return this.bucket.upload(file, {destination});
  }

  bucketGetPublicUrl(path) {
    return 'https://storage.googleapis.com' + this.bucketName + path;
  }
};
