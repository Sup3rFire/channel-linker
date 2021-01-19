module.exports.execute = async (client, message, args) => {
  const mFilter = (m) => {
    return m.author.id == message.author.id;
  };
  const rFilter = (reaction, user) => {
    return (
      ["➡️", "↔️"].includes(reaction.emoji.name) && user.id == message.author.id
    );
  };

  const action = await message.channel.send(
    "Select the channel you want to link/delink from (You can use channel ids)"
  );

  message.channel
    .awaitMessages(mFilter, { max: 1, time: 200000, errors: ["time"] })
    .then(async (p) => {
      const prim = p.first();
      const primChannel =
        prim.mentions.channels.first() ||
        client.channels.cache.get(prim.content);

      if (!primChannel) return message.channel.send("Invalid Channel");

      const gMember = await primChannel.guild.members.fetch(message.author);
      if (!gMember.hasPermission(8))
        return message.channel.send("Insufficient Permissions");
      prim.delete();

      await action.edit(
        "Select the channel you want to link/delink to (You can use channel ids)"
      );
      message.channel
        .awaitMessages(mFilter, { max: 1, time: 200000, errors: ["time"] })
        .then(async (s) => {
          const sec = s.first();
          const secChannel =
            sec.mentions.channels.first() ||
            client.channels.cache.get(sec.content);

          if (!secChannel) return message.channel.send("Invalid Channel");

          const gMember = await secChannel.guild.members.fetch(message.author);
          if (!gMember.hasPermission(8))
            return message.channel.send("Insufficient Permissions");
          sec.delete();

          const primInfo = (await client.clink.get(primChannel.id)) || [];
          const secInfo = (await client.clink.get(secChannel.id)) || [];
          if (
            primInfo.includes(secChannel.id) ||
            secInfo.includes(primChannel.id)
          ) {
            let index = primInfo.indexOf(secInfo);
            if (index > -1) {
              primInfo.splice(index, 1);
            }
            index = secInfo.indexOf(secInfo);
            if (index > -1) {
              secInfo.splice(index, 1);
            }
            message.channel.send("De Linked");
          } else {
            await action.edit("Select The Link Mode (1 Way ➡️ / 2 Way ↔️ )");
            await action.reactions.removeAll();
            for (const reaction of ["➡️", "↔️"]) {
              try {
                await action.react(reaction);
              } catch (error) {
                return message.channel.send(
                  "An emoji failed to react. Please ensure that the bot has sufficient permissions"
                );
              }
            }

            action
              .awaitReactions(rFilter, {
                max: 1,
                time: 200000,
                errors: ["time"],
              })
              .then(async (t) => {
                const type = t.first().emoji.name;
                let typeNum;
                switch (type) {
                  case "➡️":
                    typeNum = 0;
                    break;
                  case "↔️":
                    typeNum = 1;
                    break;

                  default:
                    break;
                }
                primInfo.push(secChannel.id);
                client.clink.set(primChannel.id, primInfo);
                if (typeNum == 1) {
                  secInfo.push(primChannel.id);
                  client.clink.set(secChannel.id, secInfo);
                }
                message.channel.send(
                  `Channels Linked From <#${primChannel.id}>: ${primInfo
                    .map((c) => `<#${c}>`)
                    .join(", ")}\nChannels Linked From <#${
                    secChannel.id
                  }>: ${secInfo.map((c) => `<#${c}>`).join(", ")}`
                );
              })
              .catch((e) =>
                message.channel.send("Operation cancelled (Timed out)" + e)
              );
          }
        })
        .catch(() => message.channel.send("Operation cancelled (Timed out)"));
    })
    .catch(() => message.channel.send("Operation cancelled (Timed out)"));
};

module.exports.info = {
  name: "link",
  description: "Links or de-links a channel",
  aliases: ["delink"],
  cooldown: 3,
  guildOnly: true,
  permissions: 8,
};
