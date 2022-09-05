export class ageTokenDocument extends TokenDocument {
    /**
     * When the Actor data overrides change for an un-linked Token Actor, simulate the pre-update process.
     * @param {object} data
     * @param {object} options
     * @param {User} user
     * @returns {Promise<void>}
     * @private
     */
    async _preUpdateTokenActor(data, options, user) {
        const embeddedKeys = new Set(["_id"]);

        // Simulate modification of embedded documents
        if ( options.embedded ) {
            const {embeddedName, hookData} = options.embedded;
            const cls = getDocumentClass(embeddedName);
            const documents = data[cls.metadata.collection];
            embeddedKeys.add(cls.metadata.collection);
            const result = [];

            // Handle different embedded operations
            switch (options.action) {
            case "create":
                for ( const d of hookData ) {
                const createData = foundry.utils.deepClone(d);
                const doc = new cls(d, {parent: this.actor});
                await doc._preCreate(d, options, user);
                const allowed = options.noHook || Hooks.call(`preCreate${embeddedName}`, doc, createData, options, user.id);
                if ( allowed === false ) {
                    documents.findSplice(toCreate => toCreate._id === d._id);
                    hookData.findSplice(toCreate => toCreate._id === d._id);
                    console.debug(`${vtt} | ${embeddedName} creation prevented by preCreate hook`);
                }
                else result.push(d);
                }
                this.actor._preCreateEmbeddedDocuments(embeddedName, result, options, user.id);
                break;

            case "update":
                for ( const [i, d] of documents.entries() ) {
                const update = hookData[d._id];
                if ( !update ) continue;
                const doc = this.actor.getEmbeddedDocument(embeddedName, d._id);
                await doc._preUpdate(update, options, user);
                const allowed = options.noHook || Hooks.call(`preUpdate${embeddedName}`, doc, update, options, user.id);
                if ( allowed === false ) {
                    documents[i] = doc.toObject();
                    delete hookData[doc.id];
                    console.debug(`${vtt} | ${embeddedName} update prevented by preUpdate hook`);
                }
                else {
                    const d = data[doc.collectionName].find(d => d._id === doc.id);
                    foundry.utils.mergeObject(d, update, {performDeletions: true}); // Re-apply update data which may have changed in a preUpdate hook
                    result.push(update);
                }
                }
                this.actor._preUpdateEmbeddedDocuments(embeddedName, result, options, user.id);
                break;

            case "delete":
                for ( const id of hookData ) {
                const doc = this.actor.getEmbeddedDocument(embeddedName, id);
                await doc._preDelete(options, user);
                const allowed = options.noHook || Hooks.call(`preDelete${embeddedName}`, doc, options, user.id);
                if ( allowed === false ) {
                    documents.push(doc.toObject());
                    hookData.findSplice(toDelete => toDelete === doc.id);
                    console.debug(`${vtt} | ${embeddedName} deletion prevented by preDelete hook`);
                }
                else result.push(id);
                }
                this.actor._preDeleteEmbeddedDocuments(embeddedName, result, options, user.id);
                break;
            }
        }

        // Simulate updates to the Actor itself
        if ( Object.keys(data).some(k => !embeddedKeys.has(k)) ) {
            await this.actor._preUpdate(data, options, user);
            Hooks.callAll("preUpdateActor", this.actor, data, options, user.id);
        }
    }

    async _onCreate(tokenData, options, userId) {
        await super._onCreate(tokenData, options, userId);
        // Ensure this change occurs only once
        if (game.user.id !== userId) return
        if (this.actor?.type !== "char") return;
        const updateData = {};
        if (!this.bar1?.attribute) updateData["bar1.attribute"] = "health";
        if (!this.bar2?.attribute) {
            const barData = await game.settings.get("age-system", "usePowerPoints") ? "powerPoints" : ((this.actor.hasPlayerOwner) && (await game.settings.get("age-system", "useConviction")) ? "conviction" : null);
            if (barData) updateData["bar2.attribute"] = barData;
        }
        if (this.actor.hasPlayerOwner) {
            updateData["displayBars"] = 10;
            updateData["disposition"] = 1;
            updateData["actorLink"] = true;
        } else {
            updateData["displayBars"] = 20;
        };

        await this.object.document.update(updateData);
    }
};